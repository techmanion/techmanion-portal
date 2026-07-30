from __future__ import annotations

from datetime import date
from enum import Enum

from sqlalchemy import Date, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.common import TimestampMixin
from app.models.employees import Employee


class ProjectStatus(str, Enum):
    PLANNED = "PLANNED"
    ACTIVE = "ACTIVE"
    ON_HOLD = "ON_HOLD"
    COMPLETED = "COMPLETED"


class Project(TimestampMixin, Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(160), unique=True)
    client_name: Mapped[str] = mapped_column(String(160))
    status: Mapped[ProjectStatus] = mapped_column(
        SqlEnum(ProjectStatus), default=ProjectStatus.PLANNED
    )
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    assignments: Mapped[list[ProjectAssignment]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )


class ProjectAssignment(TimestampMixin, Base):
    __tablename__ = "project_assignments"
    __table_args__ = (UniqueConstraint("project_id", "employee_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"))
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"))

    project: Mapped[Project] = relationship(back_populates="assignments")
    employee: Mapped[Employee] = relationship()
