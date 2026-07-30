from datetime import date, datetime

from pydantic import EmailStr, Field, field_validator

from app.models import CandidateStage, EmployeeType, JobStatus
from app.schemas.common import ApiModel


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
