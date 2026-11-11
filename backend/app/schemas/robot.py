from __future__ import annotations

from datetime import datetime
from pydantic import BaseModel


class RobotOut(BaseModel):
    id: int
    name: str
    status: str
    battery: int
    x: float
    y: float
    current_task_id: int | None
    last_seen: datetime

    class Config:
        from_attributes = True


class RobotUpdate(BaseModel):
    status: str | None = None
    battery: int | None = None
    x: float | None = None
    y: float | None = None
    current_task_id: int | None = None
