from __future__ import annotations

from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.patient import Patient
from app.models.vital_reading import VitalReading
from app.schemas.vitals import VitalReadingCreate, VitalReadingOut
from app.services.alert_engine import process_vital

router = APIRouter(prefix="/vitals", tags=["vitals"])


@router.post("", response_model=VitalReadingOut)
def create_vital(
    reading: VitalReadingCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    patient = db.query(Patient).filter(Patient.id == reading.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    db_reading = VitalReading(
        patient_id=reading.patient_id,
        robot_id=reading.robot_id,
        type=reading.type,
        value=reading.value,
        quality=reading.quality,
        timestamp=reading.timestamp or datetime.utcnow(),
    )
    db.add(db_reading)
    db.commit()
    db.refresh(db_reading)

    # Run the alert engine on the new reading (threshold + trend rules).
    process_vital(db, db_reading)

    # Broadcast live vital update.
    import asyncio

    try:
        asyncio.get_event_loop().create_task(
            __import__("app.ws.manager", fromlist=["manager"]).manager.broadcast(
                {
                    "type": "vital",
                    "data": {
                        "id": db_reading.id,
                        "patient_id": db_reading.patient_id,
                        "robot_id": db_reading.robot_id,
                        "type": db_reading.type,
                        "value": db_reading.value,
                        "quality": db_reading.quality,
                        "timestamp": db_reading.timestamp.isoformat(),
                    },
                }
            )
        )
    except RuntimeError:
        pass

    return db_reading


@router.get("", response_model=list[VitalReadingOut])
def list_vitals(
    patient_id: int | None = Query(None),
    limit: int = Query(100, le=1000),
    db: Session = Depends(get_db),
):
    query = db.query(VitalReading).order_by(VitalReading.timestamp.desc())
    if patient_id is not None:
        query = query.filter(VitalReading.patient_id == patient_id)
    return query.limit(limit).all()
