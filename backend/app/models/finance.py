from datetime import date
from enum import Enum

from sqlalchemy import BigInteger, Date, String, Text
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.common import TimestampMixin


class ExpenseType(str, Enum):
    ONE_TIME = "ONE_TIME"
    MONTHLY_RECURRING = "MONTHLY_RECURRING"


class ExpenseFrequency(str, Enum):
    MONTHLY = "MONTHLY"


class Expense(TimestampMixin, Base):
    __tablename__ = "expenses"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(160))
    category: Mapped[str] = mapped_column(String(100))
    amount: Mapped[int] = mapped_column(BigInteger)
    currency: Mapped[str] = mapped_column(String(3), default="PKR")
    expense_type: Mapped[ExpenseType] = mapped_column(SqlEnum(ExpenseType))
    frequency: Mapped[ExpenseFrequency | None] = mapped_column(
        SqlEnum(ExpenseFrequency), nullable=True
    )
    expense_date: Mapped[date] = mapped_column(Date)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
