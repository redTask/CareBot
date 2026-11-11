from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class MedicationEvent(Base):
    __tablename__ = "medication_events"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    medication_id: Mapped[int] = mapped_column(ForeignKey("medications.id"), nullable=False)
    due_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending")  # pending | acknowledged | missed
    acknowledged_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
