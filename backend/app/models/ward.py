from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.escalation_policy import EscalationPolicy


class Ward(Base):
    __tablename__ = "wards"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)

    beds: Mapped[list["Bed"]] = relationship("Bed", cascade="all, delete-orphan")
    escalation_policies: Mapped[list["EscalationPolicy"]] = relationship(
        EscalationPolicy, cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"<Ward(id={self.id}, name={self.name})>"
