from typing import Any

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Medication(Base):
    __tablename__ = "medications"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), nullable=False)
    drug: Mapped[str] = mapped_column(String(100), nullable=False)
    dose: Mapped[str] = mapped_column(String(100), nullable=False)
    schedule_times: Mapped[list[Any]] = mapped_column(JSON, default=list)
