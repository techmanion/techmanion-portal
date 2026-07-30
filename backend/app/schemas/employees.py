from datetime import date, datetime

from pydantic import EmailStr, Field, field_validator

from app.models import EmployeeStatus, EmployeeType
from app.schemas.common import ApiModel, NamedOption


class SalaryOut(ApiModel):
    id: int
    base_amount: int
    currency: str
    effective_date: date
    reason: str


class EmployeeBase(ApiModel):
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(default="", max_length=80)
    email: EmailStr
    phone: str = Field(default="", max_length=40)
    employee_type: EmployeeType
    status: EmployeeStatus = EmployeeStatus.ACTIVE
    designation_id: int | None = None
    joining_date: date


class EmployeeCreate(EmployeeBase):
    base_amount: int = Field(ge=0)
    currency: str = Field(default="PKR", min_length=3, max_length=3)

    @field_validator("currency")
    @classmethod
    def uppercase_currency(cls, value: str) -> str:
        return value.upper()


class EmployeeUpdate(EmployeeBase):
    pass


class EmployeeOut(EmployeeBase):
    id: int
    full_name: str
    designation: NamedOption | None = None
    current_salary: SalaryOut | None = None
    created_at: datetime


class SalaryCreate(ApiModel):
    base_amount: int = Field(ge=0)
    currency: str = Field(default="PKR", min_length=3, max_length=3)
    effective_date: date
    reason: str = "RATE_CHANGE"


class DocumentOut(ApiModel):
    id: int
    kind: str
    file_name: str
    mime_type: str
    size_bytes: int
    created_at: datetime
