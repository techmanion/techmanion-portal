from __future__ import annotations

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.config import settings
from app.database import Base
from app.models.common import TimestampMixin
from app.models.employees import Employee, EmployeeType


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(120))
    role: Mapped[EmployeeType] = mapped_column(SqlEnum(EmployeeType), default=EmployeeType.EXECUTIVE)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    avatar_key: Mapped[str | None] = mapped_column(String(255), nullable=True)
    employee_id: Mapped[int | None] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL"), unique=True, nullable=True
    )

    employee: Mapped[Employee | None] = relationship()

    @property
    def avatar_url(self) -> str | None:
        if not self.avatar_key:
            return None
        return f"{settings.s3_public_base_url.rstrip('/')}/{self.avatar_key}"

    @property
    def employee_code(self) -> str | None:
        if not self.employee:
            return None
        identifier = self.employee.current_identifier
        return identifier.code if identifier else None
