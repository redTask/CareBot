"""Medication event acknowledge / missed endpoints."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, require_role
from app.models.medication import Medication
from app.models.medication_event import MedicationEvent
from app.models.patient import Patient
from app.models.user import User
from app.schemas.medication import MedicationEventOut
from app.services.medication_scheduler import acknowledge_medication_event, mark_medication_event_missed

router = APIRouter(prefix="/medication-events", tags=["medication-events"])


@router.get("", response_model=list[MedicationEventOut])
def list_events(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    patient_id: int | None = Query(None),
    status: str | None = Query(None),
    limit: int = Query(100, le=500),
):
    query = (
        db.query(MedicationEvent, Medication, Patient)
        .join(Medication, MedicationEvent.medication_id == Medication.id)
        .outerjoin(Patient, Medication.patient_id == Patient.id)
    )
    if patient_id is not None:
        query = query.filter(Medication.patient_id == patient_id)
    if status is not None:
        query = query.filter(MedicationEvent.status == status)
    rows = query.order_by(MedicationEvent.due_at.desc()).limit(limit).all()
    return [
        MedicationEventOut(
            id=event.id,
            medication_id=event.medication_id,
            patient_id=med.patient_id,
            patient_name=patient.name if patient else None,
            drug=med.drug,
            dose=med.dose,
            due_at=event.due_at,
            status=event.status,
            acknowledged_at=event.acknowledged_at,
        )
        for event, med, patient in rows
    ]


@router.post("/{event_id}/acknowledge")
def acknowledge(
    event_id: int,
    current_user: Annotated[User, Depends(require_role("nurse", "doctor", "admin"))],
    db: Session = Depends(get_db),
):
    try:
        event = acknowledge_medication_event(db, event_id, current_user.id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    return {"status": "acknowledged", "event_id": event.id}


@router.post("/{event_id}/missed")
def missed(
    event_id: int,
    current_user: Annotated[User, Depends(require_role("nurse", "doctor", "admin"))],
    db: Session = Depends(get_db),
):
    try:
        event = mark_medication_event_missed(db, event_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    return {"status": "missed", "event_id": event.id}
