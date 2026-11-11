"""Medication event acknowledge / missed endpoints."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, require_role
from app.models.medication import Medication
from app.models.medication_event import MedicationEvent
from app.models.patient import Patient
from app.models.user import User
from app.services.medication_scheduler import acknowledge_medication_event, mark_medication_event_missed

router = APIRouter(prefix="/medication-events", tags=["medication-events"])


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
