from sqlalchemy import ForeignKey
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class CarePlan(Base):
    __tablename__ = "care_plans"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), nullable=False, unique=True)
    notes: Mapped[str] = mapped_column(default="")
    thresholds: Mapped[dict] = mapped_column(JSON, default=dict)
