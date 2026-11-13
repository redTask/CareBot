"""Stats endpoint for impact page — read-only summaries computed from existing data.\"\"\"

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from app.api.deps import get_db, get_current_user
from app.models.alert import Alert
from app.models.task import Task
from app.models.medication_event import MedicationEvent
from app.models.robot import Robot
from app.models.patient import Patient

router = APIRouter(prefix="/stats", tags=["stats"])


def _now_utc() -> datetime:
    return datetime.now(timezone.utc)


@router.get("", response_model=dict[str, any])
def get_stats(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, any]:
    """Return impact stats: avg time-to-acknowledge, alerts per day by severity,
    tasks completed vs failed, robot uptime, missed medicines."""

    # --- Avg time to acknowledge an alert (in hours) ---
    acknowledged = (
        db.query(Alert)
        .filter(Alert.status == "acknowledged")
        .filter(Alert.acknowledged_at.isnot(None))
        .all()
    )
    avg_hours: float | None = None
    if acknowledged:
        total_seconds = sum(
            (a.acknowledged_at - a.created_at).total_seconds() for a in acknowledged
        )
        avg_hours = round(total_seconds / len(acknowledged) / 3600, 2)

    # --- Alerts per day by severity (last 30 days) ---
    thirty_days_ago = _now_utc() - timedelta(days=30)
    alerts_by_day_severity = (
        db.query(
            func.date(Alert.created_at).label("day"),
            Alert.severity,
            func.count(Alert.id).label("count"),
        )
        .filter(Alert.created_at >= thirty_days_ago)
        .group_by("day", Alert.severity)
        .order_by("day", Alert.severity)
        .all()
    )
    alerts_per_day: dict[str, dict[str, int]] = {}
    for day, severity, count in alerts_by_day_severity:
        day_str = str(day)
        if day_str not in alerts_per_day:
            alerts_per_day[day_str] = {}
        alerts_per_day[day_str][severity] = alerts_per_day[day_str].get(severity, 0) + count

    # --- Tasks completed vs failed (last 30 days) ---
    finished = (
        db.query(Task)
        .filter(Task.updated_at >= thirty_days_ago)
        .filter(Task.status.in_(("done", "cancelled", "failed")))
        .all()
    )
    tasks_completed = sum(1 for t in finished if t.status == "done")
    tasks_failed = sum(1 for t in finished if t.status == "failed")

    # --- Robot uptime (percentage of time robots were online in last 30 days) ---
    robots = db.query(Robot).all()
    total_robot_hours = 0.0
    online_robot_hours = 0.0
    for r in robots:
        # Approximate: last_seen to now
        if r.last_seen:
            delta = _now_utc() - r.last_seen
            total_robot_hours += delta.total_seconds() / 3600.0
            if r.status != "stopped" and r.status != "offline":
                online_robot_hours += delta.total_seconds() / 3600.0
    robot_uptime_pct = (
        round((online_robot_hours / total_robot_hours * 100) if total_robot_hours > 0 else 0.0, 1)
        if total_robot_hours > 0
        else None
    )

    # --- Missed medicines (medication events with status=missed in last 30 days) ---
    missed = (
        db.query(MedicationEvent)
        .filter(MedicationEvent.status == "missed")
        .filter(MedicationEvent.due_at >= thirty_days_ago)
        .count()
    )

    return {
        "avg_time_to_acknowledge_hours": avg_hours,
        "alerts_per_day_by_severity": alerts_per_day,
        "tasks_completed": tasks_completed,
        "tasks_failed": tasks_failed,
        "robot_uptime_percent": robot_uptime_pct,
        "missed_medicines": missed,
    }