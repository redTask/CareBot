from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_db, get_current_user
from app.models.care_plan import CarePlan
from app.models.medication import Medication
from app.models.patient import Patient
from app.models.vital_reading import VitalReading
from app.schemas.patient import CarePlanOut, MedicationOut, PatientOut

router = APIRouter(prefix="/patients", tags=["patients"])


@router.get("/{patient_id}", response_model=PatientOut)
def get_patient(
    patient_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    patient = (
        db.query(Patient)
        .options(joinedload(Patient.bed))
        .filter(Patient.id == patient_id)
        .first()
    )
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    care_plan = db.query(CarePlan).filter(CarePlan.patient_id == patient_id).first()
    medications = (
        db.query(Medication).filter(Medication.patient_id == patient_id).all()
    )

    return PatientOut(
        id=patient.id,
        name=patient.name,
        age=patient.age,
        sex=patient.sex,
        bed_id=patient.bed_id,
        conditions=patient.conditions,
        care_plan=(
            CarePlanOut(
                id=care_plan.id,
                notes=care_plan.notes,
                thresholds=care_plan.thresholds,
            )
            if care_plan
            else None
        ),
        medications=[
            MedicationOut(
                id=m.id,
                drug=m.drug,
                dose=m.dose,
                schedule_times=m.schedule_times,
            )
            for m in medications
        ],
    )
