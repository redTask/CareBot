"""Care plan CRUD — doctors can edit thresholds and notes."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, require_role
from app.models.care_plan import CarePlan
from app.models.patient import Patient
from app.models.user import User
from app.schemas.care_plan import CarePlanOut, CarePlanUpdate
from app.services.audit import log_action

router = APIRouter(prefix="/care-plans", tags=["care-plans"])


@router.get("/{patient_id}", response_model=CarePlanOut)
def get_care_plan(
    patient_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    care_plan = (
        db.query(CarePlan).filter(CarePlan.patient_id == patient_id).first()
    )
    if not care_plan:
        care_plan = CarePlan(patient_id=patient_id, notes="", thresholds={})
        db.add(care_plan)
        db.commit()
        db.refresh(care_plan)
    return care_plan


@router.put("/{patient_id}", response_model=CarePlanOut)
def update_care_plan(
    patient_id: int,
    plan_in: CarePlanUpdate,
    current_user: Annotated[User, Depends(require_role("doctor", "admin"))],
    db: Session = Depends(get_db),
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    care_plan = (
        db.query(CarePlan).filter(CarePlan.patient_id == patient_id).first()
    )
    if not care_plan:
        care_plan = CarePlan(patient_id=patient_id, notes="", thresholds={})
        db.add(care_plan)
        db.commit()
        db.refresh(care_plan)

    if plan_in.notes is not None:
        care_plan.notes = plan_in.notes
    if plan_in.thresholds is not None:
        care_plan.thresholds = plan_in.thresholds
    db.commit()
    db.refresh(care_plan)

    # Audit entry
    log_action(
        db,
        action="care_plan_updated",
        entity="care_plan",
        details={
            "patient_id": patient_id,
            "notes": plan_in.notes,
            "thresholds": plan_in.thresholds,
        },
        user=current_user,
    )
    return care_plan
