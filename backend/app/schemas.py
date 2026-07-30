from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models import (
    CandidateStage,
    EmployeeStatus,
    EmployeeType,
    JobStatus,
    PayrollEntryStatus,
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
    is_active: bool
    created_at: datetime


class TokenOut(ApiModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ProfileUpdate(ApiModel):
    name: str = Field(min_length=1, max_length=120)


class PasswordChange(ApiModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


class UserCreate(ApiModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: UserRole = UserRole.HR


class UserAdminUpdate(ApiModel):
    role: UserRole | None = None
    is_active: bool | None = None


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


class ProjectAssignmentCreate(ApiModel):
    employee_id: int


class AssignmentOut(ApiModel):
    id: int
    employee_id: int
    employee_name: str


class ProjectBase(ApiModel):
    name: str = Field(min_length=1, max_length=160)
    client_name: str = Field(min_length=1, max_length=160)
    status: ProjectStatus = ProjectStatus.PLANNED
    start_date: date
    end_date: date | None = None
    notes: str | None = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(ProjectBase):
    pass


class ProjectOut(ProjectBase):
    id: int
    assignments: list[AssignmentOut] = []


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


class ActivityOut(ApiModel):
    id: int
    entity: str
    entity_id: str
    action: str
    description: str
    timestamp: datetime


class HomeItem(ApiModel):
    kind: str
    title: str
    description: str
    event_date: date | None = None
    href: str


class HomeOut(ApiModel):
    needs_attention: list[HomeItem]
    upcoming: list[HomeItem]
    recent_activity: list[ActivityOut]


class DocumentOut(ApiModel):
    id: int
    kind: str
    file_name: str
    mime_type: str
    size_bytes: int
    created_at: datetime


class JobBase(ApiModel):
    title: str = Field(min_length=1, max_length=160)
    description: str = Field(min_length=1)
    status: JobStatus = JobStatus.OPEN


class JobCreate(JobBase):
    pass


class JobUpdate(JobBase):
    pass


class JobOut(JobBase):
    id: int
    created_at: datetime


class CandidateBase(ApiModel):
    full_name: str = Field(min_length=1, max_length=160)
    email: EmailStr
    phone: str | None = None
    job_id: int
    stage: CandidateStage = CandidateStage.APPLIED
    resume: str | None = None
    interview_date: date | None = None
    notes: str | None = None


class CandidateCreate(CandidateBase):
    pass


class CandidateUpdate(CandidateBase):
    pass


class CandidateOut(CandidateBase):
    id: int
    job_title: str
    created_at: datetime


class ConvertToEmployeePayload(ApiModel):
    employee_type: EmployeeType
    joining_date: date
    designation_id: int | None = None
    base_amount: int = Field(ge=0)
    currency: str = Field(default="PKR", min_length=3, max_length=3)

    @field_validator("currency")
    @classmethod
    def uppercase_currency(cls, value: str) -> str:
        return value.upper()
