from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.dependencies import CurrentUser, DbSession, ExecutiveUser
from app.core.errors import get_or_404
from app.core.uploads import delete_avatar, store_avatar
from app.models import EmployeeType, User
from app.schemas import (
    PasswordChange,
    ProfileUpdate,
    TokenOut,
    UserAccessUpdate,
    UserCreate,
    UserOut,
)
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(tags=["auth"])


def _active_executive_count(db: Session) -> int:
    return (
        db.scalar(
            select(func.count())
            .select_from(User)
            .where(User.role == EmployeeType.EXECUTIVE, User.is_active.is_(True))
        )
        or 0
    )


@router.post("/auth/login", response_model=TokenOut)
def login(form: Annotated[OAuth2PasswordRequestForm, Depends()], db: DbSession) -> TokenOut:
    user = db.scalar(select(User).where(User.email == form.username.lower()))
    if not user or not user.is_active or not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email or password is incorrect.")
    return TokenOut(access_token=create_access_token(user.id), user=UserOut.model_validate(user))


@router.get("/auth/me", response_model=UserOut)
def me(user: CurrentUser) -> User:
    return user


@router.patch("/auth/me", response_model=UserOut)
def update_profile(payload: ProfileUpdate, db: DbSession, user: CurrentUser) -> User:
    user.name = payload.name.strip()
    db.commit()
    db.refresh(user)
    return user


@router.post("/auth/me/avatar", response_model=UserOut)
async def upload_my_avatar(db: DbSession, user: CurrentUser, file: UploadFile = File(...)) -> User:
    key = await store_avatar(file)
    old_key = user.avatar_key
    user.avatar_key = key
    db.commit()
    delete_avatar(old_key)
    db.refresh(user)
    return user


@router.post("/auth/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(payload: PasswordChange, db: DbSession, user: CurrentUser) -> None:
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
    user.password_hash = hash_password(payload.new_password)
    db.commit()


@router.get("/users", response_model=list[UserOut])
def list_users(db: DbSession, _: ExecutiveUser) -> list[User]:
    return list(db.scalars(select(User).order_by(User.name)).all())


@router.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, db: DbSession, executive: ExecutiveUser) -> User:
    new_user = User(
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        name=payload.name.strip(),
        role=payload.role,
    )
    db.add(new_user)
    try:
        db.flush()
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="A user with this email already exists.") from exc
    db.refresh(new_user)
    return new_user


@router.patch("/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: int, payload: UserAccessUpdate, db: DbSession, executive: ExecutiveUser
) -> User:
    target = get_or_404(db, User, user_id, "User was not found.")
    demoting_self = (
        target.id == executive.id
        and payload.role is not None
        and payload.role != EmployeeType.EXECUTIVE
    )
    deactivating_self = target.id == executive.id and payload.is_active is False
    if demoting_self or deactivating_self:
        raise HTTPException(
            status_code=400, detail="You cannot revoke your own core member access."
        )

    losing_executive_access = (
        payload.role is not None and payload.role != EmployeeType.EXECUTIVE
    ) or (payload.is_active is False)
    if (
        target.role == EmployeeType.EXECUTIVE
        and target.is_active
        and losing_executive_access
        and _active_executive_count(db) <= 1
    ):
        raise HTTPException(
            status_code=400, detail="At least one active core member must remain."
        )

    if payload.role is not None:
        target.role = payload.role
    if payload.is_active is not None:
        target.is_active = payload.is_active
    db.commit()
    db.refresh(target)
    return target


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db: DbSession, executive: ExecutiveUser) -> None:
    target = get_or_404(db, User, user_id, "User was not found.")
    if target.id == executive.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account.")
    if (
        target.role == EmployeeType.EXECUTIVE
        and target.is_active
        and _active_executive_count(db) <= 1
    ):
        raise HTTPException(
            status_code=400, detail="At least one active core member must remain."
        )
    try:
        db.delete(target)
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail=(
                "This account has existing activity (e.g. compensation or document records) "
                "and cannot be deleted. Deactivate it instead."
            ),
        ) from exc
