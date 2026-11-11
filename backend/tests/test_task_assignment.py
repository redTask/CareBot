"""Tests for task orchestration — nearest robot, battery > 20%, priority."""

from __future__ import annotations

from app.models.task import Task
from app.services.task_orchestrator import (
    create_task,
    cancel_task,
    complete_task,
    assign_nearest_robot,
    get_priority_rank,
)


def test_priority_rank_order():
    assert get_priority_rank("emergency") < get_priority_rank("patient_call")
    assert get_priority_rank("patient_call") < get_priority_rank("medication")
    assert get_priority_rank("medication") < get_priority_rank("delivery")
    assert get_priority_rank("delivery") < get_priority_rank("patrol")


def test_assign_nearest_robot(db_session, seed_data):
    """Assign the nearest idle robot with battery > 20%."""
    bed = seed_data["bed"]
    robots = seed_data["robots"]
    # r1 at (0,0), r2 at (10,10), r3 at (1,1) but low battery (10%)
    task = Task(
        type="visit_bed",
        priority="emergency",
        bed_id=bed.id,
        robot_id=None,
        status="queued",
    )
    db_session.add(task)
    db_session.commit()
    db_session.refresh(task)

    robot = assign_nearest_robot(db_session, task)
    assert robot is not None
    assert robot.id == robots[0].id  # r1 is nearest (0,0) and battery 100%
    assert robot.battery > 20


def test_low_battery_robot_not_assigned(db_session, seed_data):
    """Robot with battery <= 20% should not be assigned."""
    bed = seed_data["bed"]
    task = Task(
        type="visit_bed",
        priority="emergency",
        bed_id=bed.id,
        robot_id=None,
        status="queued",
    )
    db_session.add(task)
    db_session.commit()
    db_session.refresh(task)

    # r1 at (0,0) nearest, but r3 at (1,1) has 10% battery -> excluded
    # Only r1 (100%) and r2 (95%) are candidates. r1 is nearest.
    robot = assign_nearest_robot(db_session, task)
    assert robot is not None
    assert robot.battery > 20


def test_no_available_robot(db_session, seed_data):
    """Return None when no idle robot with battery > 20%."""
    # Mark all robots busy or low battery
    for r in seed_data["robots"]:
        r.status = "busy"
    db_session.commit()

    bed = seed_data["bed"]
    task = Task(
        type="visit_bed",
        priority="emergency",
        bed_id=bed.id,
        robot_id=None,
        status="queued",
    )
    db_session.add(task)
    db_session.commit()
    db_session.refresh(task)

    robot = assign_nearest_robot(db_session, task)
    assert robot is None


def test_create_task_auto_assigns(db_session, seed_data):
    """create_task auto-assigns nearest robot."""
    bed = seed_data["bed"]
    nurse = seed_data["nurse"]
    task = create_task(
        db_session,
        type="vitals_check",
        priority="medication",
        bed_id=bed.id,
        created_by=nurse.id,
        auto_assign=True,
    )
    assert task.robot_id is not None
    assert task.status == "running"


def test_cancel_task(db_session, seed_data):
    """Cancel a running task frees its robot."""
    bed = seed_data["bed"]
    task = create_task(
        db_session,
        type="visit_bed",
        priority="delivery",
        bed_id=bed.id,
        auto_assign=True,
    )
    assert task.status == "running"

    cancelled = cancel_task(db_session, task.id)
    assert cancelled.status == "cancelled"

    # Robot should be idle again
    from app.models.robot import Robot
    robot = db_session.query(Robot).filter(Robot.id == task.robot_id).first()
    assert robot.status == "idle"
    assert robot.current_task_id is None


def test_complete_task(db_session, seed_data):
    """Complete a task frees its robot."""
    bed = seed_data["bed"]
    task = create_task(
        db_session,
        type="patrol",
        priority="patrol",
        bed_id=bed.id,
        auto_assign=True,
    )
    assert task.status == "running"

    completed = complete_task(db_session, task.id)
    assert completed.status == "done"

    from app.models.robot import Robot
    robot = db_session.query(Robot).filter(Robot.id == task.robot_id).first()
    assert robot.status == "idle"
