from datetime import date, datetime

from pydantic import EmailStr, Field, field_validator

from app.models import CandidateStage, EmployeeType, JobStatus
from app.schemas.common import ApiModel


class JobBase(ApiModel):
    title: str = Field(min_length=1, max_length=160)
    department: str = Field(min_length=1, max_length=120)
    location: str = Field(min_length=1, max_length=160)
    type: str = Field(min_length=1, max_length=80)
    summary: str = Field(min_length=1)
    description: str = Field(min_length=1)
    responsibilities: list[str] = Field(default_factory=list)
    requirements: list[str] = Field(default_factory=list)
    application_link: str | None = Field(default=None, max_length=500)
    status: JobStatus = JobStatus.OPEN

    @field_validator("responsibilities", "requirements")
    @classmethod
    def clean_list_items(cls, value: list[str]) -> list[str]:
        return [item.strip() for item in value if item.strip()]


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


class CandidateStageUpdate(ApiModel):
    stage: CandidateStage


class CandidateOut(CandidateBase):
    id: int
    job_title: str
    created_at: datetime


class ConvertToEmployeePayload(ApiModel):
    employee_type: EmployeeType
    joining_date: date
    designation_id: int
    base_amount: int = Field(ge=0)
    currency: str = Field(default="PKR", min_length=3, max_length=3)

    @field_validator("currency")
    @classmethod
    def uppercase_currency(cls, value: str) -> str:
        return value.upper()
