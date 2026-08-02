from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload

from app.api.dependencies import CurrentUser, DbSession, ExecutiveUser
from app.core.uploads import delete_avatar, store_avatar
from app.models import Employee, EmployeeType, User
from app.schemas import (
    PasswordChange,
    TokenOut,
    UserCreate,
    UserOut,
)
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(tags=["auth"])


@router.post("/auth/login", response_model=TokenOut)
def login(form: Annotated[OAuth2PasswordRequestForm, Depends()], db: DbSession) -> TokenOut:
    user = db.scalar(select(User).where(User.email == form.username.lower()))
    if not user or not user.is_active or not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email or password is incorrect.")
    return TokenOut(access_token=create_access_token(user.id), user=UserOut.model_validate(user))


@router.get("/auth/me", response_model=UserOut)
def me(user: CurrentUser) -> User:
    return user


@router.post("/auth/me/avatar", response_model=UserOut)
async def upload_my_avatar(db: DbSession, user: CurrentUser, file: UploadFile = File(...)) -> User:
    key = await store_avatar(file, folder="users")
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
    statement = (
        select(User)
        .options(selectinload(User.employee).selectinload(Employee.identifiers))
        .order_by(User.name)
    )
    return list(db.scalars(statement).all())


@router.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, db: DbSession, _: ExecutiveUser) -> User:
    employee = db.get(Employee, payload.employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee was not found.")
    if employee.employee_type != EmployeeType.EXECUTIVE:
        raise HTTPException(
            status_code=400, detail="Portal access can only be granted to core members."
        )
    if db.scalar(select(User).where(User.employee_id == employee.id)):
        raise HTTPException(
            status_code=409, detail="This employee already has a portal account."
        )
    new_user = User(
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        name=employee.full_name,
        role=EmployeeType.EXECUTIVE,
        employee_id=employee.id,
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
