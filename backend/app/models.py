from __future__ import annotations

from datetime import UTC, date, datetime
from enum import Enum
from typing import Any

from sqlalchemy import (
    JSON,
    BigInteger,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def utc_now() -> datetime:
    return datetime.now(UTC)


class UserRole(str, Enum):
    ADMIN = "ADMIN"
    HR = "HR"
    MANAGER = "MANAGER"
    EMPLOYEE = "EMPLOYEE"


class EmployeeType(str, Enum):
    FULL_TIME = "FULL_TIME"
    PART_TIME = "PART_TIME"
    CONTRACT = "CONTRACT"


class EmployeeStatus(str, Enum):
    ACTIVE = "ACTIVE"
    ON_LEAVE = "ON_LEAVE"
    RESIGNED = "RESIGNED"
    TERMINATED = "TERMINATED"


class CompensationType(str, Enum):
    FIXED = "FIXED"
    HOURLY = "HOURLY"
    PROJECT = "PROJECT"


class ProjectStatus(str, Enum):
    PLANNING = "PLANNING"
    IN_PROGRESS = "IN_PROGRESS"
    ON_HOLD = "ON_HOLD"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class PayrollStatus(str, Enum):
    DRAFT = "DRAFT"
    COMPLETED = "COMPLETED"


class PaymentStatus(str, Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    PARTIALLY_PAID = "PARTIALLY_PAID"


class LineItemType(str, Enum):
    EARNING = "EARNING"
    DEDUCTION = "DEDUCTION"


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now
    )


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(120))
    role: Mapped[UserRole] = mapped_column(SqlEnum(UserRole), default=UserRole.HR)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class Department(TimestampMixin, Base):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class Designation(TimestampMixin, Base):
    __tablename__ = "designations"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class Employee(TimestampMixin, Base):
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(primary_key=True)
    first_name: Mapped[str] = mapped_column(String(80))
    last_name: Mapped[str] = mapped_column(String(80))
    cnic: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    phone: Mapped[str] = mapped_column(String(40))
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    emergency_contact_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    emergency_contact_phone: Mapped[str | None] = mapped_column(String(40), nullable=True)
    employee_type: Mapped[EmployeeType] = mapped_column(SqlEnum(EmployeeType))
    status: Mapped[EmployeeStatus] = mapped_column(
        SqlEnum(EmployeeStatus), default=EmployeeStatus.ACTIVE
    )
    compensation_type: Mapped[CompensationType] = mapped_column(
        SqlEnum(CompensationType), default=CompensationType.FIXED
    )
    department_id: Mapped[int | None] = mapped_column(ForeignKey("departments.id"))
    designation_id: Mapped[int | None] = mapped_column(ForeignKey("designations.id"))
    joining_date: Mapped[date] = mapped_column(Date)
    probation_end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    confirmation_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    access_log: Mapped[str | None] = mapped_column(Text, nullable=True)

    department: Mapped[Department | None] = relationship()
    designation: Mapped[Designation | None] = relationship()
    salary_revisions: Mapped[list[SalaryRevision]] = relationship(
        back_populates="employee",
        cascade="all, delete-orphan",
        order_by="SalaryRevision.effective_date",
    )
    bank_detail: Mapped[BankDetail | None] = relationship(
        back_populates="employee", cascade="all, delete-orphan", uselist=False
    )

    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}".strip()


class SalaryRevision(TimestampMixin, Base):
    __tablename__ = "salary_revisions"

    id: Mapped[int] = mapped_column(primary_key=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id", ondelete="CASCADE"))
    base_amount: Mapped[int] = mapped_column(BigInteger)
    currency: Mapped[str] = mapped_column(String(3), default="PKR")
    effective_date: Mapped[date] = mapped_column(Date)
    reason: Mapped[str] = mapped_column(String(32), default="HIRE")
    created_by_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))

    employee: Mapped[Employee] = relationship(back_populates="salary_revisions")


class BankDetail(TimestampMixin, Base):
    __tablename__ = "bank_details"

    id: Mapped[int] = mapped_column(primary_key=True)
    employee_id: Mapped[int] = mapped_column(
        ForeignKey("employees.id", ondelete="CASCADE"), unique=True
    )
    account_title: Mapped[str | None] = mapped_column(String(120), nullable=True)
    account_number: Mapped[str | None] = mapped_column(String(80), nullable=True)
    iban: Mapped[str | None] = mapped_column(String(80), nullable=True)
    bank_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    payment_method: Mapped[str] = mapped_column(String(32), default="BANK_TRANSFER")

    employee: Mapped[Employee] = relationship(back_populates="bank_detail")


class EmployeeDocument(TimestampMixin, Base):
    __tablename__ = "employee_documents"

    id: Mapped[int] = mapped_column(primary_key=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id", ondelete="CASCADE"))
    kind: Mapped[str] = mapped_column(String(32))
    file_key: Mapped[str] = mapped_column(String(500), unique=True)
    file_name: Mapped[str] = mapped_column(String(255))
    mime_type: Mapped[str] = mapped_column(String(120))
    size_bytes: Mapped[int] = mapped_column(BigInteger)
    uploaded_by_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))


class Project(TimestampMixin, Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(160), unique=True)
    client_name: Mapped[str] = mapped_column(String(160))
    status: Mapped[ProjectStatus] = mapped_column(
        SqlEnum(ProjectStatus), default=ProjectStatus.PLANNING
    )
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    contract_value: Mapped[int] = mapped_column(BigInteger, default=0)
    currency: Mapped[str] = mapped_column(String(3), default="PKR")
    trello_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    assignments: Mapped[list[ProjectAssignment]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )


class ProjectAssignment(TimestampMixin, Base):
    __tablename__ = "project_assignments"
    __table_args__ = (UniqueConstraint("project_id", "employee_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"))
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"))
    project_role: Mapped[str] = mapped_column(String(100))
    allocation_pct: Mapped[int] = mapped_column(Integer)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    project: Mapped[Project] = relationship(back_populates="assignments")
    employee: Mapped[Employee] = relationship()


class PayrollRun(TimestampMixin, Base):
    __tablename__ = "payroll_runs"

    id: Mapped[int] = mapped_column(primary_key=True)
    period_month: Mapped[str] = mapped_column(String(7), unique=True, index=True)
    status: Mapped[PayrollStatus] = mapped_column(
        SqlEnum(PayrollStatus), default=PayrollStatus.DRAFT
    )
    created_by_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    payslips: Mapped[list[Payslip]] = relationship(
        back_populates="payroll_run", cascade="all, delete-orphan"
    )


class Payslip(TimestampMixin, Base):
    __tablename__ = "payslips"
    __table_args__ = (UniqueConstraint("payroll_run_id", "employee_id"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    payroll_run_id: Mapped[int] = mapped_column(ForeignKey("payroll_runs.id"))
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"))
    base_amount: Mapped[int] = mapped_column(BigInteger)
    currency: Mapped[str] = mapped_column(String(3))
    gross_amount: Mapped[int] = mapped_column(BigInteger)
    tax_amount: Mapped[int] = mapped_column(BigInteger)
    net_amount: Mapped[int] = mapped_column(BigInteger)
    payment_status: Mapped[PaymentStatus] = mapped_column(
        SqlEnum(PaymentStatus), default=PaymentStatus.PENDING
    )
    paid_amount: Mapped[int] = mapped_column(BigInteger, default=0)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    payroll_run: Mapped[PayrollRun] = relationship(back_populates="payslips")
    employee: Mapped[Employee] = relationship()
    line_items: Mapped[list[PayslipLineItem]] = relationship(
        back_populates="payslip", cascade="all, delete-orphan"
    )


class PayslipLineItem(TimestampMixin, Base):
    __tablename__ = "payslip_line_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    payslip_id: Mapped[int] = mapped_column(ForeignKey("payslips.id", ondelete="CASCADE"))
    item_type: Mapped[LineItemType] = mapped_column(SqlEnum(LineItemType))
    category: Mapped[str] = mapped_column(String(32))
    label: Mapped[str] = mapped_column(String(120))
    amount: Mapped[int] = mapped_column(BigInteger)
    currency: Mapped[str] = mapped_column(String(3))
    payslip: Mapped[Payslip] = relationship(back_populates="line_items")


class TaxSlab(TimestampMixin, Base):
    __tablename__ = "tax_slabs"
    __table_args__ = (UniqueConstraint("fiscal_year", "lower_bound"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    fiscal_year: Mapped[str] = mapped_column(String(9))
    lower_bound: Mapped[int] = mapped_column(BigInteger)
    upper_bound: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    fixed_amount: Mapped[int] = mapped_column(BigInteger, default=0)
    rate_bps_over_lower: Mapped[int] = mapped_column(Integer, default=0)


class CompanyProfile(TimestampMixin, Base):
    __tablename__ = "company_profiles"

    id: Mapped[int] = mapped_column(primary_key=True, default=1)
    name: Mapped[str] = mapped_column(String(160), default="Techmanion")
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    default_currency: Mapped[str] = mapped_column(String(3), default="PKR")
    logo_text: Mapped[str] = mapped_column(String(80), default="Techmanion")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    actor_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    action: Mapped[str] = mapped_column(String(100))
    entity_type: Mapped[str] = mapped_column(String(100))
    entity_id: Mapped[str] = mapped_column(String(80))
    before: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    after: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
