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
    role: EmployeeType = EmployeeType.EMPLOYEE


class UserAccessUpdate(ApiModel):
    role: EmployeeType | None = None
    is_active: bool | None = None
