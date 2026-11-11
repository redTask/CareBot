from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.bed import Bed
from app.models.robot import Robot
from app.models.user import User


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    type: Mapped[str] = mapped_column(String(30), nullable=False)  # visit_bed | vitals_check | deliver | patrol | return_to_dock
    priority: Mapped[str] = mapped_column(String(20), nullable=False)  # emergency | patient_call | medication | delivery | patrol
    bed_id: Mapped[Optional[int]] = mapped_column(ForeignKey("beds.id"), nullable=True)
    robot_id: Mapped[Optional[int]] = mapped_column(ForeignKey("robots.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="queued")  # queued | running | done | failed | cancelled
    created_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    robot: Mapped[Optional["Robot"]] = relationship(Robot, foreign_keys=[robot_id])
    bed: Mapped[Optional["Bed"]] = relationship(Bed, foreign_keys=[bed_id])
    creator: Mapped[Optional["User"]] = relationship(User, foreign_keys=[created_by])
