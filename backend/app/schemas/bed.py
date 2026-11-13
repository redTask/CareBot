from __future__ import annotations

from datetime import datetime
from typing import Any
from pydantic import BaseModel

from app.schemas.base import APIModel


class VitalSummary(APIModel):
    type: str
    value: float
    quality: str
    timestamp: datetime


class PatientBrief(APIModel):
    id: int
    name: str
    age: int
    sex: str
    conditions: str

    class Config:
        from_attributes = True


class BedOut(APIModel):
    id: int
    label: str
    x: float
    y: float
    patient: PatientBrief | None = None
    # Latest reading per vital type, so the UI can show all three tiles.
    latest_vitals: dict[str, VitalSummary] = {}
    # Kept for backward compatibility: the single most recent reading.
    latest_vital: VitalSummary | None = None
    status: str = "normal"  # normal | watch | critical
    last_checked: datetime | None = None

    class Config:
        from_attributes = True


class BedList(APIModel):
    beds: list[BedOut]
