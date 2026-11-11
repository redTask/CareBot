from typing import Optional

from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.patient import Patient
from app.models.ward import Ward


class Bed(Base):
    __tablename__ = "beds"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    ward_id: Mapped[int] = mapped_column(ForeignKey("wards.id"), nullable=False)
    label: Mapped[str] = mapped_column(String(20), nullable=False)
    x: Mapped[float] = mapped_column(Float, default=0.0)
    y: Mapped[float] = mapped_column(Float, default=0.0)

    ward: Mapped["Ward"] = relationship(Ward)
    patient: Mapped[Optional["Patient"]] = relationship(Patient, uselist=False)

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Bed(id={self.id}, label={self.label})>"
