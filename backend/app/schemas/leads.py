from datetime import datetime

from pydantic import EmailStr, Field

from app.models.leads import LeadAudience, LeadStatus
from app.schemas.common import ApiModel


class LeadCreate(ApiModel):
    name: str = Field(min_length=1, max_length=160)
    email: EmailStr
    company: str | None = Field(default=None, max_length=160)
    goal: str | None = None
    audience: LeadAudience


class LeadReceiptOut(ApiModel):
    id: int


class LeadStatusUpdate(ApiModel):
    status: LeadStatus


class LeadOut(ApiModel):
    id: int
    name: str
    email: str
    company: str | None = None
    goal: str | None = None
    audience: LeadAudience
    status: LeadStatus
    created_at: datetime
