from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, require_role
from app.models.user import User
from app.schemas.user import UserOut

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
def read_me(current_user: Annotated[User, Depends(get_current_user)]):
    return current_user


@router.get("", response_model=list[UserOut])
def list_users(
    current_user: Annotated[User, Depends(require_role("admin"))],
    db: Session = Depends(get_db),
):
    return db.query(User).all()
