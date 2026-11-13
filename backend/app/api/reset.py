"""Admin reset endpoint — reseeds demo data and clears alerts/tasks."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.user import UserOut

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/reset-demo-data", response_model=UserOut)
def reset_demo_data(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserOut:
    """Reseed demo data and clear alerts, tasks, and medication events.

    Only accessible to admin users. Resets patients, vitals, medications,
    and clears all alerts and tasks from the database.
    """

    # Check admin role
    if current_user.role != "admin":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Admin access required")

    from app.db.session import SessionLocal
    from app.models.alert import Alert
    from app.models.task import Task
    from app.models.medication_event import MedicationEvent

    # Clear all alerts, tasks, and medication events first
    db.query(Alert).delete()
    db.query(Task).delete()
    db.query(MedicationEvent).delete()
    db.commit()

    # Reseed demo data
    from app.seed import seed

    seed()

    # Return the admin user
    user = db.query(User).filter(User.role == "admin").first()
    if user:
        return UserOut.model_validate(user)
    raise HTTPException(status_code=500, detail="Failed to reseed data")