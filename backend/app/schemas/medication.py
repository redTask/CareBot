from __future__ import annotations

from datetime import datetime

from app.schemas.base import APIModel


class MedicationEventOut(APIModel):
    id: int
    medication_id: int
    patient_id: int | None
    patient_name: str | None
    drug: str | None
    dose: str | None
    due_at: datetime | None
    status: str
    acknowledged_at: datetime | None
