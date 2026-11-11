"""Alert CRUD and acknowledge endpoint."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_db, get_current_user, require_role
from app.models.alert import Alert
from app.models.robot import Robot
from app.models.task import Task
from app.models.user import User
from app.schemas.alert import AlertOut, AlertAcknowledge
from app.services.task_orchestrator import create_task

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("", response_model=list[AlertOut])
def list_alerts(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    patient_id: int | None = Query(None),
    status: str | None = Query(None),
    severity: str | None = Query(None),
    limit: int = Query(100, le=1000),
):
    query = db.query(Alert).options(joinedload(Alert.patient))
    if patient_id is not None:
        query = query.filter(Alert.patient_id == patient_id)
    if status is not None:
        query = query.filter(Alert.status == status)
    if severity is not None:
        query = query.filter(Alert.severity == severity)
    return query.order_by(Alert.created_at.desc()).limit(limit).all()


@router.post("/{alert_id}/acknowledge", response_model=AlertOut)
def acknowledge_alert(
    alert_id: int,
    current_user: Annotated[User, Depends(require_role("nurse", "doctor", "admin"))],
    db: Session = Depends(get_db),
):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    if alert.status != "open":
        raise HTTPException(status_code=400, detail="Alert is not open")

    alert.status = "acknowledged"
    alert.acknowledged_by = current_user.id
    alert.acknowledged_at = __import__("datetime").datetime.now(
        __import__("datetime").timezone.utc
    )
    db.commit()
    db.refresh(alert)

    # Broadcast live
    import asyncio

    try:
        asyncio.get_event_loop().create_task(
            __import__("app.ws.manager", fromlist=["manager"]).manager.broadcast(
                {
                    "type": "alert_acknowledged",
                    "data": {
                        "id": alert.id,
                        "status": "acknowledged",
                        "acknowledged_by": alert.acknowledged_by,
                        "acknowledged_at": alert.acknowledged_at.isoformat()
                        if alert.acknowledged_at
                        else None,
                    },
                }
            )
        )
    except RuntimeError:
        pass

    # Audit entry
    from app.services.audit import log_action

    log_action(
        db,
        action="alert_acknowledged",
        entity="alert",
        details={
            "alert_id": alert.id,
            "acknowledged_by": current_user.id,
            "acknowledged_by_name": current_user.name,
        },
        user=current_user,
    )

    return alert


@router.post("/patient_call", response_model=AlertOut)
def patient_call(
    current_user: Annotated[User, Depends(require_role("nurse", "doctor", "admin"))],
    db: Session = Depends(get_db),
):
    """Simulate a patient call: create a high-priority alert and an
    auto-dispatched task to the calling bed."""
    # Find the first bed with a patient (demo: call from Bed-01).
    from app.models.bed import Bed
    from app.models.patient import Patient

    bed = (
        db.query(Bed)
        .join(Patient, Bed.id == Patient.bed_id)
        .filter(Patient.id.isnot(None))
        .first()
    )
    if not bed:
        raise HTTPException(status_code=404, detail="No patient bed found")

    patient = (
        db.query(Patient).filter(Patient.bed_id == bed.id).first()
    )

    alert = Alert(
        type="patient_call",
        severity="critical",
        patient_id=patient.id if patient else None,
        robot_id=None,
        message=f"Patient call from {bed.label}" + (f" ({patient.name})" if patient else ""),
        status="open",
        escalation_level=0,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)

    # Auto-dispatch a task to the bed.
    create_task(
        db,
        type="visit_bed",
        priority="emergency",
        bed_id=bed.id,
        created_by=current_user.id,
        auto_assign=True,
    )

    # Broadcast live
    import asyncio

    try:
        asyncio.get_event_loop().create_task(
            __import__("app.ws.manager", fromlist=["manager"]).manager.broadcast(
                {
                    "type": "alert_created",
                    "data": {
                        "id": alert.id,
                        "type": alert.type,
                        "severity": alert.severity,
                        "patient_id": alert.patient_id,
                        "robot_id": alert.robot_id,
                        "message": alert.message,
                        "status": alert.status,
                        "escalation_level": alert.escalation_level,
                        "created_at": alert.created_at.isoformat()
                        if alert.created_at
                        else None,
                    },
                }
            )
        )
    except RuntimeError:
        pass

    from app.services.audit import log_action

    log_action(
        db,
        action="patient_call",
        entity="alert",
        details={
            "alert_id": alert.id,
            "bed_id": bed.id,
            "patient_id": patient.id if patient else None,
        },
        user=current_user,
    )

    return alert


@router.post("/estop", response_model=AlertOut)
def emergency_stop(
    current_user: Annotated[User, Depends(require_role("nurse", "doctor", "admin"))],
    db: Session = Depends(get_db),
):
    """E-stop: set all robots to stopped, cancel running tasks, create a
    critical alert and an audit entry."""
    robots = db.query(Robot).all()
    for robot in robots:
        robot.status = "stopped"

    running_tasks = (
        db.query(Task)
        .filter(Task.status.in_(("queued", "running")))
        .all()
    )
    for task in running_tasks:
        task.status = "cancelled"

    alert = Alert(
        type="emergency_stop",
        severity="critical",
        patient_id=None,
        robot_id=None,
        message="EMERGENCY STOP activated — all robots halted.",
        status="open",
        escalation_level=0,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)

    import asyncio

    try:
        asyncio.get_event_loop().create_task(
            __import__("app.ws.manager", fromlist=["manager"]).manager.broadcast(
                {
                    "type": "alert_created",
                    "data": {
                        "id": alert.id,
                        "type": alert.type,
                        "severity": alert.severity,
                        "patient_id": alert.patient_id,
                        "robot_id": alert.robot_id,
                        "message": alert.message,
                        "status": alert.status,
                        "escalation_level": alert.escalation_level,
                        "created_at": alert.created_at.isoformat()
                        if alert.created_at
                        else None,
                    },
                }
            )
        )
    except RuntimeError:
        pass

    # Broadcast robot stopped + task cancelled to all clients.
    try:
        asyncio.get_event_loop().create_task(
            __import__("app.ws.manager", fromlist=["manager"]).manager.broadcast(
                {
                    "type": "estop_activated",
                    "data": {
                        "robots": [r.id for r in robots],
                        "cancelled_tasks": [t.id for t in running_tasks],
                    },
                }
            )
        )
    except RuntimeError:
        pass

    from app.services.audit import log_action

    log_action(
        db,
        action="emergency_stop",
        entity="system",
        details={
            "robots_stopped": [r.id for r in robots],
            "tasks_cancelled": [t.id for t in running_tasks],
        },
        user=current_user,
    )

    return alert


@router.post("/resume", response_model=AlertOut)
def resume(
    current_user: Annotated[User, Depends(require_role("nurse", "doctor"))],
    db: Session = Depends(get_db),
):
    """Resume: requires nurse or doctor. Sets stopped robots back to idle."""
    robots = db.query(Robot).filter(Robot.status == "stopped").all()
    for robot in robots:
        robot.status = "idle"

    alert = Alert(
        type="resume",
        severity="info",
        patient_id=None,
        robot_id=None,
        message="System resumed — robots back to idle.",
        status="open",
        escalation_level=0,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)

    import asyncio

    try:
        asyncio.get_event_loop().create_task(
            __import__("app.ws.manager", fromlist=["manager"]).manager.broadcast(
                {
                    "type": "alert_created",
                    "data": {
                        "id": alert.id,
                        "type": alert.type,
                        "severity": alert.severity,
                        "patient_id": alert.patient_id,
                        "robot_id": alert.robot_id,
                        "message": alert.message,
                        "status": alert.status,
                        "escalation_level": alert.escalation_level,
                        "created_at": alert.created_at.isoformat()
                        if alert.created_at
                        else None,
                    },
                }
            )
        )
    except RuntimeError:
        pass

    try:
        asyncio.get_event_loop().create_task(
            __import__("app.ws.manager", fromlist=["manager"]).manager.broadcast(
                {
                    "type": "estop_resumed",
                    "data": {
                        "robots": [r.id for r in robots],
                    },
                }
            )
        )
    except RuntimeError:
        pass

    from app.services.audit import log_action

    log_action(
        db,
        action="resume",
        entity="system",
        details={
            "robots_resumed": [r.id for r in robots],
        },
        user=current_user,
    )

    return alert
