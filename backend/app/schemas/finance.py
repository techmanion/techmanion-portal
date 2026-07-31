from datetime import date

from pydantic import Field, field_validator, model_validator

from app.models import ExpenseFrequency, ExpenseType
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


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(ExpenseBase):
    pass


class ExpenseOut(ExpenseBase):
    id: int


class IncomeOut(ApiModel):
    id: int
    date: date
    project_id: int
    project_name: str
    client_name: str
    amount: int
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
    payroll_total: int
    net_cash_flow: int
    recent_transactions: list[FinanceTransactionOut]
