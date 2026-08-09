from __future__ import annotations

from datetime import date
from enum import Enum

from sqlalchemy import BigInteger, Boolean, Date, ForeignKey, String, Text
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.common import Currency, TimestampMixin


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
    bank_transaction_id: Mapped[int | None] = mapped_column(
        ForeignKey("bank_transactions.id"), nullable=True
    )

    bank_transaction: Mapped["BankTransaction | None"] = relationship()


class TransactionType(str, Enum):
    CREDIT = "CREDIT"
    DEBIT = "DEBIT"


class TransactionSource(str, Enum):
    MANUAL = "MANUAL"
    EXPENSE = "EXPENSE"
    INCOME = "INCOME"
    PAYROLL = "PAYROLL"
    TRANSFER = "TRANSFER"


class BankAccount(TimestampMixin, Base):
    __tablename__ = "bank_accounts"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(160))
    bank_name: Mapped[str] = mapped_column(String(160))
    currency: Mapped[Currency] = mapped_column(SqlEnum(Currency))
    opening_balance: Mapped[int] = mapped_column(BigInteger, default=0)
    opening_balance_pkr: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    account_identifier: Mapped[str | None] = mapped_column(String(160), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    transactions: Mapped[list[BankTransaction]] = relationship(
        back_populates="bank_account",
        cascade="all, delete-orphan",
        foreign_keys="BankTransaction.bank_account_id",
        order_by=lambda: (
            BankTransaction.transaction_date.desc(),
            BankTransaction.id.desc(),
        ),
    )


class BankTransaction(TimestampMixin, Base):
    __tablename__ = "bank_transactions"

    id: Mapped[int] = mapped_column(primary_key=True)
    bank_account_id: Mapped[int] = mapped_column(
        ForeignKey("bank_accounts.id", ondelete="CASCADE")
    )
    transaction_type: Mapped[TransactionType] = mapped_column(SqlEnum(TransactionType))
    transaction_date: Mapped[date] = mapped_column(Date)
    amount: Mapped[int] = mapped_column(BigInteger)
    pkr_equivalent: Mapped[int] = mapped_column(BigInteger)
    description: Mapped[str] = mapped_column(String(200))
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    transfer_id: Mapped[str | None] = mapped_column(String(36), nullable=True, index=True)
    counterparty_account_id: Mapped[int | None] = mapped_column(
        ForeignKey("bank_accounts.id"), nullable=True
    )
    source: Mapped[TransactionSource] = mapped_column(
        SqlEnum(TransactionSource), default=TransactionSource.MANUAL
    )

    bank_account: Mapped[BankAccount] = relationship(
        back_populates="transactions", foreign_keys=[bank_account_id]
    )
    counterparty_account: Mapped[BankAccount | None] = relationship(
        foreign_keys=[counterparty_account_id]
    )

    @property
    def is_transfer(self) -> bool:
        return self.transfer_id is not None

    @property
    def is_reconciled(self) -> bool:
        """A transaction is reconciled once it's explained by a tracked income,
        expense, payroll payment, or transfer leg — as opposed to a manual credit or
        debit recorded without a linked source."""
        return self.source != TransactionSource.MANUAL
