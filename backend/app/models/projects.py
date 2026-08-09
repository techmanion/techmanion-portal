from __future__ import annotations

from datetime import date
from decimal import Decimal
from enum import Enum

from sqlalchemy import BigInteger, Boolean, Date, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.common import Currency, TimestampMixin
from app.models.finance import BankTransaction

__all__ = [
    "Currency",
    "MilestoneStatus",
    "PaymentStatus",
    "Project",
    "ProjectMilestone",
    "ProjectPayment",
    "ProjectStatus",
    "ProjectType",
]


class ProjectStatus(str, Enum):
    PLANNED = "PLANNED"
    ACTIVE = "ACTIVE"
    ON_HOLD = "ON_HOLD"
    COMPLETED = "COMPLETED"


class ProjectType(str, Enum):
    MONTHLY_RECURRING = "MONTHLY_RECURRING"
    FIXED = "FIXED"
    HOURLY = "HOURLY"


class MilestoneStatus(str, Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"


class PaymentStatus(str, Enum):
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    PARTIALLY_PAID = "PARTIALLY_PAID"
    FULLY_PAID = "FULLY_PAID"
    OVERDUE = "OVERDUE"


class Project(TimestampMixin, Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(160), unique=True)
    client_name: Mapped[str] = mapped_column(String(160))
    project_type: Mapped[ProjectType] = mapped_column(SqlEnum(ProjectType))
    status: Mapped[ProjectStatus] = mapped_column(
        SqlEnum(ProjectStatus), default=ProjectStatus.PLANNED
    )
    currency: Mapped[Currency] = mapped_column(SqlEnum(Currency), default=Currency.PKR)
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    monthly_amount: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    billing_day: Mapped[int | None] = mapped_column(Integer, nullable=True)
    auto_renew: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

    contract_value: Mapped[int | None] = mapped_column(BigInteger, nullable=True)

    hourly_rate: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    estimated_hours: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    logged_hours: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)

    milestones: Mapped[list[ProjectMilestone]] = relationship(
        back_populates="project",
        cascade="all, delete-orphan",
        order_by=lambda: (ProjectMilestone.due_date, ProjectMilestone.id),
    )
    payments: Mapped[list[ProjectPayment]] = relationship(
        back_populates="project",
        cascade="all, delete-orphan",
        order_by=lambda: (ProjectPayment.payment_date.desc(), ProjectPayment.id.desc()),
    )


class ProjectMilestone(TimestampMixin, Base):
    __tablename__ = "project_milestones"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(160))
    amount: Mapped[int] = mapped_column(BigInteger)
    due_date: Mapped[date] = mapped_column(Date)
    status: Mapped[MilestoneStatus] = mapped_column(
        SqlEnum(MilestoneStatus), default=MilestoneStatus.PENDING
    )
    paid_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    project: Mapped[Project] = relationship(back_populates="milestones")


class ProjectPayment(TimestampMixin, Base):
    __tablename__ = "project_payments"

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"))
    amount: Mapped[int] = mapped_column(BigInteger)
    payment_date: Mapped[date] = mapped_column(Date)
    method: Mapped[str] = mapped_column(String(80))
    reference: Mapped[str | None] = mapped_column(String(160), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    bank_transaction_id: Mapped[int | None] = mapped_column(
        ForeignKey("bank_transactions.id"), nullable=True
    )

    project: Mapped[Project] = relationship(back_populates="payments")
    bank_transaction: Mapped[BankTransaction | None] = relationship()
