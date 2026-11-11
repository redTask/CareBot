from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel


class VitalReadingCreate(BaseModel):
    patient_id: int
    robot_id: int | None = None
    type: str  # heart_rate | spo2 | temperature
    value: float
    quality: str = "good"  # good | low
    timestamp: datetime | None = None


class VitalReadingOut(BaseModel):
    id: int
    patient_id: int
    robot_id: int | None
    type: str
    value: float
    quality: str
    timestamp: datetime

    class Config:
        from_attributes = True
