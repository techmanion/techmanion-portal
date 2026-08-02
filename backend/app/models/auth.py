from __future__ import annotations

from sqlalchemy import Boolean, String
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.common import TimestampMixin
from app.models.employees import EmployeeType


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(120))
    role: Mapped[EmployeeType] = mapped_column(SqlEnum(EmployeeType), default=EmployeeType.EMPLOYEE)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    avatar_key: Mapped[str | None] = mapped_column(String(255), nullable=True)

    @property
    def avatar_url(self) -> str | None:
        return f"/avatars/{self.avatar_key}" if self.avatar_key else None
