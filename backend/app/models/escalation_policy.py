from typing import Any

from sqlalchemy import ForeignKey
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class EscalationPolicy(Base):
    __tablename__ = "escalation_policies"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    ward_id: Mapped[int] = mapped_column(ForeignKey("wards.id"), nullable=False)
    steps: Mapped[list[Any]] = mapped_column(JSON, default=list)
