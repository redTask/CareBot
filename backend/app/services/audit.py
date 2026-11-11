"""Audit log helper — writes every mutating action to the audit_log table."""

from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from app.models.audit_log import AuditLog
from app.models.user import User


def log_action(
    db: Session,
    action: str,
    entity: str,
    details: dict[str, Any] | None = None,
    user: User | None = None,
) -> AuditLog:
    user_id = user.id if user else None
    entry = AuditLog(
        user_id=user_id,
        action=action,
        entity=entity,
        details=details or {},
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry
