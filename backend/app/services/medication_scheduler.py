"""Medication scheduler — at scheduled times, create a MedicationEvent and a
robot visit task. A missed medicine creates an alert."""

from __future__ import annotations

import asyncio
from datetime import datetime, time, timedelta, timezone
from typing import Any

from sqlalchemy.orm import Session, sessionmaker

from app.db.session import SessionLocal, engine
from app.models.medication import Medication
from app.models.medication_event import MedicationEvent
from app.models.patient import Patient
from app.services.alert_engine import _create_alert
from app.services.audit import log_action
from app.services.task_orchestrator import create_task, cancel_task
from app.ws.manager import manager

CHECK_INTERVAL_SECONDS = 10


async def run_medication_scheduler(stop_event: asyncio.Event) -> None:
    """Background loop: for each medication whose schedule time is now, create a
    MedicationEvent (status pending) and a robot visit task."""
    while not stop_event.is_set():
        try:
            db = SessionLocal()
            try:
                _process_due_medications(db)
            finally:
                db.close()
        except Exception:  # noqa: BLE001
            pass
        await asyncio.sleep(CHECK_INTERVAL_SECONDS)


def _process_due_medications(db: Session) -> None:
    now = datetime.now(timezone.utc)
    current_time = now.time().replace(second=0, microsecond=0)
    today = now.date()

    medications = db.query(Medication).all()

    for med in medications:
        patient = db.query(Patient).filter(Patient.id == med.patient_id).first()
        if not patient:
            continue

        for schedule_time_str in med.schedule_times:
            try:
                schedule_time = time.fromisoformat(schedule_time_str)
            except ValueError:  # noqa: BLE001
                continue

            # Does this scheduled time fall in the current minute window?
            if schedule_time.hour != current_time.hour or schedule_time.minute != current_time.minute:
                continue

            due_at = datetime.combine(today, schedule_time, tzinfo=timezone.utc)

            # Avoid creating duplicate events for the same medication + due time today.
            existing = (
                db.query(MedicationEvent)
                .filter(
                    MedicationEvent.medication_id == med.id,
                    MedicationEvent.due_at >= due_at - timedelta(minutes=1),
                    MedicationEvent.due_at <= due_at + timedelta(minutes=1),
                )
                .first()
            )
            if existing:
                continue

            event = MedicationEvent(
                medication_id=med.id,
                due_at=due_at,
                status="pending",
            )
            db.add(event)
            db.commit()
            db.refresh(event)

            # Create a robot visit task for this medication reminder.
            bed = patient.bed
            create_task(
                db,
                type="visit_bed",
                priority="medication",
                bed_id=bed.id if bed else None,
                created_by=None,
                auto_assign=True,
            )

            _broadcast_medication_event(event, med, patient)

            # Audit entry
            try:
                log_action(
                    db,
                    action="medication_reminder_created",
                    entity="medication_event",
                    details={
                        "event_id": event.id,
                        "medication_id": med.id,
                        "patient_id": med.patient_id,
                        "drug": med.drug,
                        "due_at": due_at.isoformat(),
                    },
                )
            except Exception:  # noqa: BLE001
                pass


def acknowledge_medication_event(
    db: Session, event_id: int, acknowledged_by_id: int
) -> MedicationEvent:
    event = db.query(MedicationEvent).filter(MedicationEvent.id == event_id).first()
    if not event:
        raise ValueError("Medication event not found")
    if event.status != "pending":
        return event

    event.status = "acknowledged"
    event.acknowledged_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(event)

    # Cancel any pending visit task linked to this medication/patient.
    med = db.query(Medication).filter(Medication.id == event.medication_id).first()
    if med:
        patient = db.query(Patient).filter(Patient.id == med.patient_id).first()
        if patient and patient.bed_id:
            from app.models.task import Task

            tasks = (
                db.query(Task)
                .filter(
                    Task.type == "visit_bed",
                    Task.bed_id == patient.bed_id,
                    Task.status.in_(("queued", "running")),
                )
                .all()
            )
            for t in tasks:
                cancel_task(db, t.id, current_user_id=acknowledged_by_id)

    _broadcast_medication_event(event, med, None, acknowledged=True)

    try:
        log_action(
            db,
            action="medication_acknowledged",
            entity="medication_event",
            details={"event_id": event.id, "acknowledged_by": acknowledged_by_id},
        )
    except Exception:  # noqa: BLE001
        pass

    return event


def mark_medication_event_missed(db: Session, event_id: int) -> MedicationEvent:
    """Mark a medication event as missed and create an alert."""
    event = db.query(MedicationEvent).filter(MedicationEvent.id == event_id).first()
    if not event:
        raise ValueError("Medication event not found")
    if event.status != "pending":
        return event

    event.status = "missed"
    db.commit()
    db.refresh(event)

    med = db.query(Medication).filter(Medication.id == event.medication_id).first()
    patient = (
        db.query(Patient).filter(Patient.id == med.patient_id).first() if med else None
    )

    if patient:
        message = f"Medication {med.drug} {med.dose} was missed for {patient.name}."
        _create_alert(
            db,
            alert_type="missed_medicine",
            severity="watch",
            patient_id=patient.id,
            robot_id=None,
            message=message,
        )

    try:
        log_action(
            db,
            action="medication_missed",
            entity="medication_event",
            details={
                "event_id": event.id,
                "medication_id": event.medication_id,
                "patient_id": patient.id if patient else None,
            },
        )
    except Exception:  # noqa: BLE001
        pass

    _broadcast_medication_event(event, med, patient, missed=True)

    return event


def _broadcast_medication_event(
    event: MedicationEvent,
    med: Any | None,
    patient: Any | None,
    acknowledged: bool = False,
    missed: bool = False,
) -> None:
    import asyncio

    try:
        loop = asyncio.get_event_loop()
        loop.create_task(
            manager.broadcast(
                {
                    "type": "medication_event",
                    "data": {
                        "id": event.id,
                        "medication_id": event.medication_id,
                        "patient_id": patient.id if patient else None,
                        "patient_name": patient.name if patient else None,
                        "drug": med.drug if med else None,
                        "dose": med.dose if med else None,
                        "due_at": event.due_at.isoformat() if event.due_at else None,
                        "status": event.status,
                        "acknowledged_at": event.acknowledged_at.isoformat()
                        if event.acknowledged_at
                        else None,
                        "acknowledged": acknowledged,
                        "missed": missed,
                    },
                }
            )
        )
    except RuntimeError:
        pass
