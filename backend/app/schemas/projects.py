from datetime import date

from pydantic import Field, model_validator

from app.models import Currency, MilestoneStatus, PaymentStatus, ProjectStatus, ProjectType
from app.schemas.common import ApiModel


class ProjectMilestoneInput(ApiModel):
    name: str = Field(min_length=1, max_length=160)
    amount: int = Field(ge=0)
    due_date: date
    status: MilestoneStatus = MilestoneStatus.PENDING
    paid_date: date | None = None


class ProjectMilestoneOut(ProjectMilestoneInput):
    id: int


class ProjectPaymentCreate(ApiModel):
    amount: int = Field(gt=0)
    payment_date: date
    method: str = Field(min_length=1, max_length=80)
    reference: str | None = Field(default=None, max_length=160)
    notes: str | None = None
    bank_account_id: int
    pkr_equivalent: int | None = Field(default=None, gt=0)


class ProjectPaymentOut(ApiModel):
    id: int
    amount: int
    payment_date: date
    method: str
    reference: str | None = None
    notes: str | None = None
    bank_account_id: int | None = None
    bank_transaction_id: int | None = None


class ProjectBase(ApiModel):
    name: str = Field(min_length=1, max_length=160)
    client_name: str = Field(min_length=1, max_length=160)
    project_type: ProjectType
    status: ProjectStatus = ProjectStatus.PLANNED
    currency: Currency
    start_date: date
    end_date: date | None = None
    notes: str | None = None

    monthly_amount: int | None = Field(default=None, ge=0)
    billing_day: int | None = Field(default=None, ge=1, le=31)
    auto_renew: bool | None = None
    contract_value: int | None = Field(default=None, ge=0)
    hourly_rate: int | None = Field(default=None, ge=0)
    estimated_hours: float | None = Field(default=None, ge=0)
    logged_hours: float | None = Field(default=None, ge=0)
    milestones: list[ProjectMilestoneInput] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_type_fields(self) -> "ProjectBase":
        if self.end_date and self.end_date < self.start_date:
            raise ValueError("End date cannot be before the start date.")
        if self.project_type == ProjectType.MONTHLY_RECURRING:
            if self.monthly_amount is None or self.billing_day is None:
                raise ValueError("Monthly amount and billing day are required for recurring projects.")
            self.auto_renew = bool(self.auto_renew)
            self.contract_value = None
            self.hourly_rate = None
            self.estimated_hours = None
            self.logged_hours = None
            self.milestones = []
        elif self.project_type == ProjectType.FIXED:
            if self.contract_value is None:
                raise ValueError("Contract value is required for fixed projects.")
            self.monthly_amount = None
            self.billing_day = None
            self.auto_renew = None
            self.hourly_rate = None
            self.estimated_hours = None
            self.logged_hours = None
        else:
            if self.hourly_rate is None:
                raise ValueError("Hourly rate is required for hourly projects.")
            self.logged_hours = self.logged_hours or 0
            self.monthly_amount = None
            self.billing_day = None
            self.auto_renew = None
            self.contract_value = None
            self.milestones = []
        return self


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(ProjectBase):
    pass


class ProjectOut(ProjectBase):
    id: int
    milestones: list[ProjectMilestoneOut] = Field(default_factory=list)
    payments: list[ProjectPaymentOut] = Field(default_factory=list)
    total_received: int
    outstanding_balance: int
    payment_status: PaymentStatus
