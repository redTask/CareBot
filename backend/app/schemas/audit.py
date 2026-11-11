from __future__ import annotations

from datetime import datetime
from typing import Any
from pydantic import BaseModel


class AuditLogOut(BaseModel):
    id: int
    user_id: int | None
    action: str
    entity: str
    details: dict[str, Any]
    timestamp: datetime | None

    class Config:
        from_attributes = True
