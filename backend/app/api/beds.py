from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc

from app.api.deps import get_db, get_current_user
from app.models.bed import Bed
from app.models.patient import Patient
from app.models.vital_reading import VitalReading
from app.schemas.bed import BedOut

router = APIRouter(prefix="/beds", tags=["beds"])

# Default thresholds (doctors can override per patient in Phase 3)
DEFAULT_THRESHOLDS = {
    "heart_rate": {"min": 50, "max": 120, "critical_min": 40, "critical_max": 140},
    "spo2": {"min": 92, "max": 100, "critical_min": 90, "critical_max": 100},
    "temperature": {"min": 36.0, "max": 38.0, "critical_min": 35.0, "critical_max": 39.0},
}


def _status_for_readings(readings, thresholds=DEFAULT_THRESHOLDS):
    """Determine bed status from the latest reading of each vital type."""
    latest_by_type: dict[str, object] = {}
    for r in readings:
        if r.type not in latest_by_type:
            latest_by_type[r.type] = r
    if not latest_by_type:
        return "normal", None
    critical = False
    watch = False
    last_checked = None
    for rtype, r in latest_by_type.items():
        ts = r.timestamp
        if last_checked is None or ts > last_checked:
            last_checked = ts
        thr = thresholds.get(rtype)
        if not thr:
            continue
        val = r.value
        if rtype == "spo2":
            if val < thr["critical_min"]:
                critical = True
            elif val < thr["min"]:
                watch = True
        else:
            if val < thr["critical_min"] or val > thr["critical_max"]:
                critical = True
            elif val < thr["min"] or val > thr["max"]:
                watch = True
    if critical:
        return "critical", last_checked
    if watch:
        return "watch", last_checked
    return "normal", last_checked


@router.get("", response_model=list[BedOut])
def list_beds(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    beds = db.query(Bed).options(joinedload(Bed.patient)).all()
    result = []
    for bed in beds:
        patient = bed.patient
        if not patient:
            result.append(
                BedOut(
                    id=bed.id,
                    label=bed.label,
                    x=bed.x,
                    y=bed.y,
                    patient=None,
                    latest_vitals={},
                    latest_vital=None,
                    status="normal",
                    last_checked=None,
                )
            )
            continue

        # Enough rows to cover the latest reading of every vital type.
        readings = (
            db.query(VitalReading)
            .filter(VitalReading.patient_id == patient.id)
            .order_by(desc(VitalReading.timestamp))
            .limit(40)
            .all()
        )
        latest_by_type: dict[str, VitalReading] = {}
        for r in readings:
            if r.type not in latest_by_type:
                latest_by_type[r.type] = r

        status, last_checked = _status_for_readings(readings)
        latest_vitals = {
            rtype: {
                "type": r.type,
                "value": r.value,
                "quality": r.quality,
                "timestamp": r.timestamp,
            }
            for rtype, r in latest_by_type.items()
        }
        latest = readings[0] if readings else None
        result.append(
            BedOut(
                id=bed.id,
                label=bed.label,
                x=bed.x,
                y=bed.y,
                patient={
                    "id": patient.id,
                    "name": patient.name,
                    "age": patient.age,
                    "sex": patient.sex,
                    "conditions": patient.conditions,
                },
                latest_vitals=latest_vitals,
                latest_vital=(
                    {
                        "type": latest.type,
                        "value": latest.value,
                        "quality": latest.quality,
                        "timestamp": latest.timestamp,
                    }
                    if latest
                    else None
                ),
                status=status,
                last_checked=last_checked,
            )
        )
    return result
