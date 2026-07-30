from datetime import date

from pydantic import Field, field_validator

from app.models import PayrollEntryStatus
from app.schemas.common import ApiModel


class PayrollEntryCreate(ApiModel):
    employee_id: int
    month: str = Field(min_length=7, max_length=7)
    base_compensation: int = Field(ge=0)
    adjustment: int = 0
    currency: str = Field(default="PKR", min_length=3, max_length=3)
    notes: str | None = None

    @field_validator("currency")
    @classmethod
    def uppercase_currency(cls, value: str) -> str:
        return value.upper()


class PayrollEntryUpdate(ApiModel):
    base_compensation: int = Field(ge=0)
    adjustment: int = 0
    currency: str = Field(default="PKR", min_length=3, max_length=3)
    notes: str | None = None

    @field_validator("currency")
    @classmethod
    def uppercase_currency(cls, value: str) -> str:
        return value.upper()


class PayrollEntryOut(ApiModel):
    id: int
    employee_id: int
    employee_name: str
    month: str
    base_compensation: int
    adjustment: int
    final_amount: int
    currency: str
    status: PayrollEntryStatus
    payment_date: date | None = None
    notes: str | None = None


class PayrollMarkPaid(ApiModel):
    payment_date: date | None = None
