from __future__ import annotations

import asyncio

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.robot import Robot
from app.schemas.robot import RobotOut, RobotUpdate
from app.ws.manager import manager

router = APIRouter(prefix="/robots", tags=["robots"])


@router.get("", response_model=list[RobotOut])
def list_robots(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(Robot).all()


@router.patch("/{robot_id}", response_model=RobotOut)
def update_robot(
    robot_id: int,
    update: RobotUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    robot = db.query(Robot).filter(Robot.id == robot_id).first()
    if not robot:
        raise HTTPException(status_code=404, detail="Robot not found")

    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(robot, field, value)
    db.commit()
    db.refresh(robot)

    try:
        asyncio.get_event_loop().create_task(
            manager.broadcast(
                {
                    "type": "robot",
                    "data": {
                        "id": robot.id,
                        "name": robot.name,
                        "status": robot.status,
                        "battery": robot.battery,
                        "x": robot.x,
                        "y": robot.y,
                        "current_task_id": robot.current_task_id,
                        "last_seen": (
                            robot.last_seen.isoformat() if robot.last_seen else None
                        ),
                    },
                }
            )
        )
    except RuntimeError:
        pass

    return robot
