from typing import Optional

from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    age: Mapped[int]
    sex: Mapped[str] = mapped_column(String(10), nullable=False)
    bed_id: Mapped[Optional[int]] = mapped_column(ForeignKey("beds.id"), nullable=True)
    conditions: Mapped[str] = mapped_column(String(255), default="")

    bed: Mapped[Optional["Bed"]] = relationship("Bed")

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Patient(id={self.id}, name={self.name})>"
