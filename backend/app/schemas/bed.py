from __future__ import annotations

from datetime import datetime
from typing import Any
from pydantic import BaseModel


class VitalSummary(BaseModel):
    type: str
    value: float
    quality: str
    timestamp: datetime


class PatientBrief(BaseModel):
    id: int
    name: str
    age: int
    sex: str
    conditions: str

    class Config:
        from_attributes = True


class BedOut(BaseModel):
    id: int
    label: str
    x: float
    y: float
    patient: PatientBrief | None = None
    latest_vital: VitalSummary | None = None
    status: str = "normal"  # normal | watch | critical
    last_checked: str | None = None

    class Config:
        from_attributes = True


class BedList(BaseModel):
    beds: list[BedOut]
