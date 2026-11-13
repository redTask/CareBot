"""Task orchestrator — auto-assign the nearest idle robot with battery > 20%."""

from __future__ import annotations

import math
from typing import Any

from sqlalchemy.orm import Session

from app.core.timeutils import iso_z
from app.models.bed import Bed
from app.models.patient import Patient
from app.models.robot import Robot
from app.models.task import Task
from app.models.user import User
from app.services.audit import log_action
from app.ws.manager import manager

# Priority order for processing the queue (lower number = higher priority).
PRIORITY_ORDER = {
    "emergency": 0,
    "patient_call": 1,
    "medication": 2,
    "delivery": 3,
    "patrol": 4,
}


def _distance(x1: float, y1: float, x2: float, y2: float) -> float:
    return math.hypot(x2 - x1, y2 - y1)


def assign_nearest_robot(db: Session, task: Task) -> Robot | None:
    """Assign the nearest idle robot with battery above 20% to a task.

    Returns the assigned robot, or None if none is available.
    """
    candidate_robots = (
        db.query(Robot)
        .filter(Robot.status == "idle", Robot.battery > 20)
        .all()
    )
    if not candidate_robots:
        return None

    # Determine target coordinates from the task's bed.
    target_x, target_y = 0.0, 0.0  # dock
    if task.bed_id:
        bed = db.query(Bed).filter(Bed.id == task.bed_id).first()
        if bed:
            target_x, target_y = bed.x, bed.y

    best_robot: Robot | None = None
    best_distance = float("inf")
    for robot in candidate_robots:
        d = _distance(robot.x, robot.y, target_x, target_y)
        if d < best_distance:
            best_distance = d
            best_robot = robot

    if best_robot:
        task.robot_id = best_robot.id
        task.status = "running"
        best_robot.status = "busy"
        best_robot.current_task_id = task.id
        db.commit()
        db.refresh(task)
        db.refresh(best_robot)
        _broadcast_task_updated(db, task)
        _broadcast_robot_updated(best_robot)

        # Audit entry
        try:
            log_action(
                db,
                action="task_assigned",
                entity="task",
                details={
                    "task_id": task.id,
                    "robot_id": best_robot.id,
                    "bed_id": task.bed_id,
                },
            )
        except Exception:  # noqa: BLE001
            pass

    return best_robot


def create_task(
    db: Session,
    *,
    type: str,
    priority: str,
    bed_id: int | None = None,
    robot_id: int | None = None,
    created_by: int | None = None,
    auto_assign: bool = True,
) -> Task:
    """Create a task and optionally auto-assign the nearest robot."""
    task = Task(
        type=type,
        priority=priority,
        bed_id=bed_id,
        robot_id=robot_id,
        status="queued",
        created_by=created_by,
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    _broadcast_task_created(db, task)

    # Audit entry
    try:
        log_action(
            db,
            action="task_created",
            entity="task",
            details={
                "task_id": task.id,
                "type": task.type,
                "priority": task.priority,
                "bed_id": task.bed_id,
            },
            user=db.query(User).filter(User.id == created_by).first()
            if created_by
            else None,
        )
    except Exception:  # noqa: BLE001
        pass

    if auto_assign and robot_id is None:
        assign_nearest_robot(db, task)

    return task


def cancel_task(db: Session, task_id: int, current_user_id: int | None = None) -> Task:
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise ValueError("Task not found")
    if task.status in ("done", "cancelled"):
        return task

    task.status = "cancelled"
    if task.robot_id:
        robot = db.query(Robot).filter(Robot.id == task.robot_id).first()
        if robot:
            robot.status = "idle"
            robot.current_task_id = None
    db.commit()
    db.refresh(task)

    _broadcast_task_updated(db, task)
    if task.robot_id:
        robot = db.query(Robot).filter(Robot.id == task.robot_id).first()
        if robot:
            _broadcast_robot_updated(robot)

    # Audit entry
    try:
        log_action(
            db,
            action="task_cancelled",
            entity="task",
            details={"task_id": task.id},
            user=db.query(User).filter(User.id == current_user_id).first()
            if current_user_id
            else None,
        )
    except Exception:  # noqa: BLE001
        pass

    return task


def complete_task(db: Session, task_id: int) -> Task:
    """Mark a task as done and free its robot."""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise ValueError("Task not found")
    task.status = "done"
    if task.robot_id:
        robot = db.query(Robot).filter(Robot.id == task.robot_id).first()
        if robot:
            robot.status = "idle"
            robot.current_task_id = None
    db.commit()
    db.refresh(task)

    _broadcast_task_updated(db, task)
    if task.robot_id:
        robot = db.query(Robot).filter(Robot.id == task.robot_id).first()
        if robot:
            _broadcast_robot_updated(robot)

    # Audit entry
    try:
        log_action(
            db,
            action="task_completed",
            entity="task",
            details={"task_id": task.id},
        )
    except Exception:  # noqa: BLE001
        pass

    return task


def get_priority_rank(priority: str) -> int:
    return PRIORITY_ORDER.get(priority, 99)


def _broadcast_task_created(db: Session, task: Task) -> None:
    import asyncio

    try:
        loop = asyncio.get_event_loop()
        loop.create_task(
            manager.broadcast(
                {
                    "type": "task_created",
                    "data": _task_dict(task),
                }
            )
        )
    except RuntimeError:
        pass


def _broadcast_task_updated(db: Session, task: Task) -> None:
    import asyncio

    try:
        loop = asyncio.get_event_loop()
        loop.create_task(
            manager.broadcast(
                {
                    "type": "task_updated",
                    "data": _task_dict(task),
                }
            )
        )
    except RuntimeError:
        pass


def _broadcast_robot_updated(robot: Robot) -> None:
    import asyncio

    try:
        loop = asyncio.get_event_loop()
        loop.create_task(
            manager.broadcast(
                {
                    "type": "robot_updated",
                    "data": {
                        "id": robot.id,
                        "name": robot.name,
                        "status": robot.status,
                        "battery": robot.battery,
                        "x": robot.x,
                        "y": robot.y,
                        "current_task_id": robot.current_task_id,
                        "last_seen": iso_z(robot.last_seen),
                    },
                }
            )
        )
    except RuntimeError:
        pass


def _task_dict(task: Task) -> dict[str, Any]:
    return {
        "id": task.id,
        "type": task.type,
        "priority": task.priority,
        "bed_id": task.bed_id,
        "robot_id": task.robot_id,
        "status": task.status,
        "created_by": task.created_by,
        "created_at": iso_z(task.created_at),
        "updated_at": iso_z(task.updated_at),
    }
