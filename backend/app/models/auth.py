from __future__ import annotations

from enum import Enum

from sqlalchemy import Boolean, String
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.common import TimestampMixin


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    HR = "HR"
    MANAGER = "MANAGER"
    EMPLOYEE = "EMPLOYEE"


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(120))
    role: Mapped[UserRole] = mapped_column(SqlEnum(UserRole), default=UserRole.HR)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
