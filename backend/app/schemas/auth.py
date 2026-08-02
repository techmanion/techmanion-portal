from datetime import datetime

from pydantic import EmailStr, Field

from app.models import EmployeeType
from app.schemas.common import ApiModel


class UserOut(ApiModel):
    id: int
    email: EmailStr
    name: str
    role: EmployeeType
    is_active: bool
    avatar_url: str | None = None
    employee_id: int | None = None
    employee_code: str | None = None
    created_at: datetime


class TokenOut(ApiModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class PasswordChange(ApiModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


class UserCreate(ApiModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    employee_id: int
