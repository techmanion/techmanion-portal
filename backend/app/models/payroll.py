from __future__ import annotations

from datetime import date
from enum import Enum

from sqlalchemy import BigInteger, Date, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.common import TimestampMixin
from app.models.employees import Employee
from app.models.finance import BankTransaction


class PayrollEntryStatus(str, Enum):
    PENDING = "PENDING"
    PAID = "PAID"


class PayrollEntry(TimestampMixin, Base):
    __tablename__ = "payroll_entries"
    __table_args__ = (UniqueConstraint("employee_id", "month"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"))
    month: Mapped[str] = mapped_column(String(7), index=True)
    base_compensation: Mapped[int] = mapped_column(BigInteger)
    adjustment: Mapped[int] = mapped_column(BigInteger, default=0)
    final_amount: Mapped[int] = mapped_column(BigInteger)
    currency: Mapped[str] = mapped_column(String(3), default="PKR")
    status: Mapped[PayrollEntryStatus] = mapped_column(
        SqlEnum(PayrollEntryStatus), default=PayrollEntryStatus.PENDING
    )
    payment_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    bank_transaction_id: Mapped[int | None] = mapped_column(
        ForeignKey("bank_transactions.id"), nullable=True
    )

    employee: Mapped[Employee] = relationship()
    bank_transaction: Mapped[BankTransaction | None] = relationship()
