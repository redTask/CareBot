"""Escalation worker — asyncio loop that advances unacknowledged alerts through
the EscalationPolicy steps. Uses Redis only as a heartbeat/lock; the timing logic
is simple asyncio polling so no separate worker process is required."""

from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone
from typing import Any

import redis

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.alert import Alert
from app.models.escalation_policy import EscalationPolicy
from app.models.user import User
from app.services.audit import log_action
from app.ws.manager import manager

# Demo escalation delay in seconds (configurable via env ESCALATION_DEMO_SECONDS).
# The EscalationPolicy steps themselves define the actual delays; this constant
# is a fallback when no policy exists.
DEMO_ESCALATION_SECONDS = int(
    __import__("os").environ.get("ESCALATION_DEMO_SECONDS", "30")
)

CHECK_INTERVAL_SECONDS = 5  # how often to poll for escalatable alerts


def _get_redis() -> redis.Redis | None:
    try:
        return redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
    except Exception:  # noqa: BLE001
        return None


async def run_escalation_worker(stop_event: asyncio.Event) -> None:
    """Background loop: advance open unacknowledged alerts to the next
    escalation level when their configured delay has elapsed."""
    r = _get_redis()
    lock_key = "carebot:escalation_worker_lock"

    while not stop_event.is_set():
        try:
            # Single-worker lock via Redis SETNX with expiry.
            if r:
                acquired = r.set(lock_key, "1", nx=True, ex=30)
                if not acquired:
                    await asyncio.sleep(CHECK_INTERVAL_SECONDS)
                    continue

            db = SessionLocal()
            try:
                await _escalate_due_alerts(db)
            finally:
                db.close()
                if r:
                    try:
                        r.delete(lock_key)
                    except Exception:  # noqa: BLE001
                        pass
        except Exception:  # noqa: BLE001
            # Never crash the worker loop.
            pass

        await asyncio.sleep(CHECK_INTERVAL_SECONDS)


async def _escalate_due_alerts(db: Session) -> None:
    now = datetime.now(timezone.utc)

    # Load all open, unacknowledged alerts.
    alerts = (
        db.query(Alert)
        .filter(Alert.status == "open", Alert.acknowledged_at.is_(None))
        .all()
    )

    for alert in alerts:
        if not alert.patient_id:
            continue

        # Get the escalation policy for the patient's ward.
        from app.models.patient import Patient
        from app.models.ward import Ward

        patient = db.query(Patient).filter(Patient.id == alert.patient_id).first()
        if not patient or not patient.bed_id:
            continue
        bed = db.query(__import__("app.models.bed", fromlist=["Bed"]).Bed).filter(
            __import__("app.models.bed", fromlist=["Bed"]).Bed.id == patient.bed_id
        ).first()
        if not bed:
            continue

        policy = (
            db.query(EscalationPolicy)
            .filter(EscalationPolicy.ward_id == bed.ward_id)
            .first()
        )
        if not policy or not policy.steps:
            # Fallback: single demo step.
            steps = [{"after_seconds": DEMO_ESCALATION_SECONDS, "notify_role": "nurse"}]
        else:
            steps = policy.steps

        # If already at the last level, nothing to do.
        if alert.escalation_level >= len(steps):
            continue

        # Determine when this alert was created.
        created_at = alert.created_at
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)

        next_step = steps[alert.escalation_level]
        due_at = created_at + timedelta(seconds=next_step["after_seconds"])

        if now < due_at:
            continue

        # Advance to the next escalation level.
        alert.escalation_level += 1
        notify_role = next_step["notify_role"]
        alert.message = f"{alert.message} [Escalated to {notify_role}]"
        db.commit()
        db.refresh(alert)

        _broadcast_alert_updated(alert)

        # Audit entry
        try:
            log_action(
                db,
                action="alert_escalated",
                entity="alert",
                details={
                    "alert_id": alert.id,
                    "escalation_level": alert.escalation_level,
                    "notify_role": notify_role,
                    "patient_id": alert.patient_id,
                },
            )
        except Exception:  # noqa: BLE001
            pass


def _broadcast_alert_updated(alert: Alert) -> None:
    import asyncio

    try:
        loop = asyncio.get_event_loop()
        loop.create_task(
            manager.broadcast(
                {
                    "type": "alert_escalated",
                    "data": {
                        "id": alert.id,
                        "type": alert.type,
                        "severity": alert.severity,
                        "patient_id": alert.patient_id,
                        "robot_id": alert.robot_id,
                        "message": alert.message,
                        "status": alert.status,
                        "escalation_level": alert.escalation_level,
                        "created_at": alert.created_at.isoformat()
                        if alert.created_at
                        else None,
                    },
                }
            )
        )
    except RuntimeError:
        pass
