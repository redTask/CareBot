from __future__ import annotations

from typing import Any
from pydantic import BaseModel


class CarePlanOut(BaseModel):
    id: int
    patient_id: int
    notes: str
    thresholds: dict[str, Any]

    class Config:
        from_attributes = True


class CarePlanUpdate(BaseModel):
    notes: str | None = None
    thresholds: dict[str, Any] | None = None
