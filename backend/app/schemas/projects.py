from datetime import date

from pydantic import Field

from app.models import ProjectStatus
from app.schemas.common import ApiModel


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
