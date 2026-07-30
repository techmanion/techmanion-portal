from __future__ import annotations

from datetime import date
from enum import Enum

from sqlalchemy import BigInteger, Date, ForeignKey, String, Text
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.common import TimestampMixin
from app.models.organization import Department, Designation


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
