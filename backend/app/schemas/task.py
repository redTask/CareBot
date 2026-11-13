from __future__ import annotations

from datetime import datetime
from typing import Any
from pydantic import BaseModel

from app.schemas.base import APIModel


class TaskOut(APIModel):
    id: int
    type: str
    priority: str
    bed_id: int | None
    robot_id: int | None
    status: str
    created_by: int | None
    created_at: datetime | None
    updated_at: datetime | None

    class Config:
        from_attributes = True


class TaskCreate(BaseModel):
    type: str  # visit_bed | vitals_check | deliver | patrol | return_to_dock
    priority: str  # emergency | patient_call | medication | delivery | patrol
    bed_id: int | None = None
