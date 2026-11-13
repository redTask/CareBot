"""Task CRUD and orchestration endpoints."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_db, get_current_user, require_role
from app.models.task import Task
from app.models.user import User
from app.schemas.task import TaskOut, TaskCreate
from app.services.task_orchestrator import (
    create_task,
    cancel_task,
    complete_task,
    assign_nearest_robot,
    get_priority_rank,
)
from app.services.audit import log_action

router = APIRouter(prefix="/tasks", tags=["tasks"])

ACTIVE_STATUSES = ("queued", "running")
FINISHED_STATUSES = ("done", "cancelled", "failed")
HISTORY_LIMIT = 5


@router.get("", response_model=list[TaskOut])
def list_tasks(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
    status: str | None = Query(None),
    priority: str | None = Query(None),
    robot_id: int | None = Query(None),
    bed_id: int | None = Query(None),
):
    query = db.query(Task).options(joinedload(Task.robot))
    if status is not None:
        query = query.filter(Task.status == status)
    if priority is not None:
        query = query.filter(Task.priority == priority)
    if robot_id is not None:
        query = query.filter(Task.robot_id == robot_id)
    if bed_id is not None:
        query = query.filter(Task.bed_id == bed_id)

    # The queue shows every active task plus only the 5 most recently
    # completed/cancelled tasks, so old history does not bury live work.
    all_tasks = query.all()
    active = [t for t in all_tasks if t.status in ACTIVE_STATUSES]
    active.sort(key=lambda t: (get_priority_rank(t.priority), t.created_at or t.id))
    finished = [t for t in all_tasks if t.status in FINISHED_STATUSES]
    finished.sort(key=lambda t: t.updated_at or t.created_at or 0, reverse=True)
    return active + finished[:HISTORY_LIMIT]


@router.delete("/old")
def clear_old_tasks(
    current_user: Annotated[User, Depends(require_role("admin"))],
    db: Session = Depends(get_db),
):
    """Admin-only: permanently remove completed and cancelled task history."""
    old_tasks = db.query(Task).filter(Task.status.in_(FINISHED_STATUSES)).all()
    removed = len(old_tasks)
    for task in old_tasks:
        db.delete(task)
    db.commit()

    try:
        log_action(
            db,
            action="tasks_cleared",
            entity="task",
            details={"removed": removed},
            user=current_user,
        )
    except Exception:  # noqa: BLE001
        pass

    return {"removed": removed}


@router.post("", response_model=TaskOut)
def create_task_endpoint(
    task_in: TaskCreate,
    current_user: Annotated[User, Depends(require_role("nurse", "doctor", "admin"))],
    db: Session = Depends(get_db),
):
    task = create_task(
        db,
        type=task_in.type,
        priority=task_in.priority,
        bed_id=task_in.bed_id,
        created_by=current_user.id,
        auto_assign=True,
    )
    return task


@router.post("/{task_id}/cancel", response_model=TaskOut)
def cancel_task_endpoint(
    task_id: int,
    current_user: Annotated[User, Depends(require_role("nurse", "doctor", "admin"))],
    db: Session = Depends(get_db),
):
    try:
        task = cancel_task(db, task_id, current_user_id=current_user.id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    return task


@router.post("/{task_id}/complete", response_model=TaskOut)
def complete_task_endpoint(
    task_id: int,
    current_user: Annotated[User, Depends(require_role("nurse", "doctor", "admin"))],
    db: Session = Depends(get_db),
):
    try:
        task = complete_task(db, task_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    return task


@router.post("/{task_id}/assign", response_model=TaskOut)
def assign_task_endpoint(
    task_id: int,
    current_user: Annotated[User, Depends(require_role("nurse", "doctor", "admin"))],
    db: Session = Depends(get_db),
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    robot = assign_nearest_robot(db, task)
    if not robot:
        raise HTTPException(
            status_code=400, detail="No idle robot with battery above 20%"
        )
    db.refresh(task)
    return task
