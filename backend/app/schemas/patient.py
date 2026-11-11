from __future__ import annotations

from datetime import datetime
from typing import Any
from pydantic import BaseModel


class CarePlanOut(BaseModel):
    id: int
    notes: str
    thresholds: dict[str, Any]

    class Config:
        from_attributes = True


class MedicationOut(BaseModel):
    id: int
    drug: str
    dose: str
    schedule_times: list[Any]

    class Config:
        from_attributes = True


class PatientOut(BaseModel):
    id: int
    name: str
    age: int
    sex: str
    bed_id: int | None
    conditions: str
    care_plan: CarePlanOut | None = None
    medications: list[MedicationOut] = []

    class Config:
        from_attributes = True
