from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models import (
    CompensationType,
    EmployeeStatus,
    EmployeeType,
    PaymentStatus,
    PayrollStatus,
    ProjectStatus,
    UserRole,
)


def to_camel(value: str) -> str:
    parts = value.split("_")
    return parts[0] + "".join(part.title() for part in parts[1:])


class ApiModel(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True,
    )


class UserOut(ApiModel):
    id: int
    email: EmailStr
    name: str
    role: UserRole


class TokenOut(ApiModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class NamedOption(ApiModel):
    id: int
    name: str
    is_active: bool


class SalaryOut(ApiModel):
    id: int
    base_amount: int
    currency: str
    effective_date: date
    reason: str


class EmployeeBase(ApiModel):
    first_name: str = Field(min_length=1, max_length=80)
    last_name: str = Field(min_length=1, max_length=80)
    cnic: str = Field(min_length=5, max_length=32)
    date_of_birth: date | None = None
    email: EmailStr
    phone: str = Field(min_length=5, max_length=40)
    address: str | None = None
    emergency_contact_name: str | None = None
    emergency_contact_phone: str | None = None
    employee_type: EmployeeType
    status: EmployeeStatus = EmployeeStatus.ACTIVE
    compensation_type: CompensationType = CompensationType.FIXED
    department_id: int | None = None
    designation_id: int | None = None
    joining_date: date
    probation_end_date: date | None = None
    confirmation_date: date | None = None
    access_log: str | None = None


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
    department: NamedOption | None = None
    designation: NamedOption | None = None
    current_salary: SalaryOut | None = None
    created_at: datetime


class SalaryCreate(ApiModel):
    base_amount: int = Field(ge=0)
    currency: str = Field(default="PKR", min_length=3, max_length=3)
    effective_date: date
    reason: str = "RATE_CHANGE"


class ProjectAssignmentCreate(ApiModel):
    employee_id: int
    project_role: str = Field(min_length=1, max_length=100)
    allocation_pct: int = Field(ge=0, le=100)
    start_date: date | None = None
    end_date: date | None = None


class AssignmentOut(ProjectAssignmentCreate):
    id: int
    employee_name: str


class ProjectBase(ApiModel):
    name: str = Field(min_length=1, max_length=160)
    client_name: str = Field(min_length=1, max_length=160)
    status: ProjectStatus = ProjectStatus.PLANNING
    start_date: date
    end_date: date | None = None
    contract_value: int = Field(default=0, ge=0)
    currency: str = Field(default="PKR", min_length=3, max_length=3)
    trello_url: str | None = None


class ProjectCreate(ProjectBase):
    pass


class ProjectOut(ProjectBase):
    id: int
    assignments: list[AssignmentOut] = []


class PayslipOut(ApiModel):
    id: int
    employee_id: int
    employee_name: str
    base_amount: int
    currency: str
    gross_amount: int
    tax_amount: int
    net_amount: int
    payment_status: PaymentStatus
    paid_amount: int


class PayrollRunOut(ApiModel):
    id: int
    period_month: str
    status: PayrollStatus
    payslips: list[PayslipOut]


class PaymentUpdate(ApiModel):
    payment_status: PaymentStatus
    paid_amount: int = Field(ge=0)


class TaxSlabInput(ApiModel):
    fiscal_year: str = Field(min_length=9, max_length=9)
    lower_bound: int = Field(ge=0)
    upper_bound: int | None = Field(default=None, ge=0)
    fixed_amount: int = Field(default=0, ge=0)
    rate_bps_over_lower: int = Field(default=0, ge=0, le=10000)


class TaxSlabOut(TaxSlabInput):
    id: int


class AuditOut(ApiModel):
    id: int
    action: str
    entity_type: str
    entity_id: str
    actor_user_id: int
    before: dict | None
    after: dict | None
    created_at: datetime


class DocumentOut(ApiModel):
    id: int
    kind: str
    file_name: str
    mime_type: str
    size_bytes: int
    created_at: datetime
