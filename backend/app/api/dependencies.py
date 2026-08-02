from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import EmployeeType, User
from app.security import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/admin/auth/login")
DbSession = Annotated[Session, Depends(get_db)]


def get_current_user(
    db: DbSession,
    token: Annotated[str, Depends(oauth2_scheme)],
) -> User:
    user_id = decode_access_token(token)
    user = db.get(User, user_id) if user_id else None
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session is invalid or expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_executive(user: CurrentUser) -> User:
    if user.role != EmployeeType.EXECUTIVE:
        raise HTTPException(status_code=403, detail="Core member access is required.")
    return user


ExecutiveUser = Annotated[User, Depends(require_executive)]
