"""Audit log view — admins only."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_db, get_current_user, require_role
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.audit import AuditLogOut

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("", response_model=list[AuditLogOut])
def list_audit_logs(
    current_user: Annotated[User, Depends(require_role("admin"))],
    db: Session = Depends(get_db),
    limit: int = Query(100, le=1000),
):
    return (
        db.query(AuditLog)
        .options(joinedload(AuditLog.user))
        .order_by(AuditLog.timestamp.desc())
        .limit(limit)
        .all()
    )
