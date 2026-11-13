from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel
from typing import Any

from app.schemas.base import APIModel


class AlertOut(APIModel):
    id: int
    type: str
    severity: str
    patient_id: int | None
    robot_id: int | None
    message: str
    status: str
    created_at: datetime | None
    acknowledged_by: int | None
    acknowledged_at: datetime | None
    escalation_level: int

    class Config:
        from_attributes = True


class AlertAcknowledge(BaseModel):
    alert_id: int
