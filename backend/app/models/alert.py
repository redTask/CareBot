from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.patient import Patient
from app.models.robot import Robot
from app.models.user import User


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)  # info | watch | critical
    patient_id: Mapped[Optional[int]] = mapped_column(ForeignKey("patients.id"), nullable=True)
    robot_id: Mapped[Optional[int]] = mapped_column(ForeignKey("robots.id"), nullable=True)
    message: Mapped[str] = mapped_column(nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="open")  # open | acknowledged | resolved
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    acknowledged_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    acknowledged_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    escalation_level: Mapped[int] = mapped_column(default=0)

    patient: Mapped[Optional["Patient"]] = relationship(Patient)
    robot: Mapped[Optional["Robot"]] = relationship(Robot)
    acker: Mapped[Optional["User"]] = relationship(User, foreign_keys=[acknowledged_by])
