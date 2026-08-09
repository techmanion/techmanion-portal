from datetime import date

from pydantic import Field, field_validator, model_validator

from app.models import Currency, ExpenseFrequency, ExpenseType, TransactionSource, TransactionType
from app.schemas.common import ApiModel


class ExpenseBase(ApiModel):
    title: str = Field(min_length=1, max_length=160)
    category: str = Field(min_length=1, max_length=100)
    amount: int = Field(gt=0)
    currency: str = Field(default="PKR", min_length=3, max_length=3)
    expense_type: ExpenseType
    frequency: ExpenseFrequency | None = None
    date: date
    notes: str | None = None

    @field_validator("currency")
    @classmethod
    def uppercase_currency(cls, value: str) -> str:
        return value.upper()

    @model_validator(mode="after")
    def validate_frequency(self) -> "ExpenseBase":
        if self.expense_type == ExpenseType.MONTHLY_RECURRING:
            self.frequency = self.frequency or ExpenseFrequency.MONTHLY
        else:
            self.frequency = None
        return self


class ExpenseWriteFields(ApiModel):
    bank_account_id: int
    pkr_equivalent: int | None = Field(default=None, gt=0)


class ExpenseCreate(ExpenseBase, ExpenseWriteFields):
    pass


class ExpenseUpdate(ExpenseBase, ExpenseWriteFields):
    pass


class ExpenseOut(ExpenseBase):
    id: int
    bank_account_id: int | None = None
    bank_transaction_id: int | None = None


class IncomeOut(ApiModel):
    id: int
    date: date
    project_id: int
    project_name: str
    client_name: str
    amount: int
    currency: str
    payment_method: str
    reference: str | None = None
    notes: str | None = None


class FinanceTransactionOut(ApiModel):
    id: str
    kind: str
    date: date
    title: str
    description: str
    amount: int
    currency: str


class FinanceOverviewOut(ApiModel):
    total_income: int
    total_expenses: int
    bank_balance: int
    net_position: int
    unreconciled_amount: int
    recent_transactions: list[FinanceTransactionOut]


class BankAccountBase(ApiModel):
    name: str = Field(min_length=1, max_length=160)
    bank_name: str = Field(min_length=1, max_length=160)
    currency: Currency
    opening_balance: int = Field(default=0, ge=0)
    opening_balance_pkr: int | None = Field(default=None, ge=0)
    is_active: bool = True
    account_identifier: str | None = Field(default=None, max_length=160)
    notes: str | None = None

    @model_validator(mode="after")
    def validate_opening_balance_pkr(self) -> "BankAccountBase":
        if self.currency == Currency.PKR:
            self.opening_balance_pkr = self.opening_balance
        elif self.opening_balance_pkr is None:
            raise ValueError(
                "PKR equivalent for the opening balance is required for non-PKR accounts."
            )
        return self


class BankAccountCreate(BankAccountBase):
    pass


class BankAccountUpdate(BankAccountBase):
    pass


class BankTransactionOut(ApiModel):
    id: int
    bank_account_id: int
    transaction_type: TransactionType
    is_transfer: bool
    date: date
    amount: int
    pkr_equivalent: int
    description: str
    notes: str | None = None
    transfer_id: str | None = None
    counterparty_account_id: int | None = None
    counterparty_account_name: str | None = None
    source: TransactionSource
    is_reconciled: bool


class BankAccountOut(BankAccountBase):
    id: int
    balance: int
    transactions: list[BankTransactionOut] = Field(default_factory=list)


class BankTransactionCreate(ApiModel):
    date: date
    amount: int = Field(gt=0)
    pkr_equivalent: int | None = Field(default=None, gt=0)
    description: str = Field(min_length=1, max_length=200)
    notes: str | None = None


class BankTransferCreate(ApiModel):
    source_account_id: int
    destination_account_id: int
    source_amount: int = Field(gt=0)
    destination_amount: int = Field(gt=0)
    date: date
    description: str = Field(min_length=1, max_length=200)
    notes: str | None = None
    pkr_equivalent: int | None = Field(default=None, gt=0)

    @model_validator(mode="after")
    def validate_accounts_differ(self) -> "BankTransferCreate":
        if self.source_account_id == self.destination_account_id:
            raise ValueError("Cannot transfer to the same account.")
        return self


class BankTransferOut(ApiModel):
    source_account: BankAccountOut
    destination_account: BankAccountOut
