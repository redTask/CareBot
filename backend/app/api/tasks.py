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

router = APIRouter(prefix="/tasks", tags=["tasks"])


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

    tasks = query.all()
    # Sort by priority order then created_at.
    tasks.sort(key=lambda t: (get_priority_rank(t.priority), t.created_at or t.id))
    return tasks


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
