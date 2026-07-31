from datetime import datetime

from pydantic import EmailStr, Field, field_validator

from app.schemas.common import ApiModel


class OrganizationUpdate(ApiModel):
    name: str = Field(min_length=1, max_length=160)
    legal_name: str | None = Field(default=None, max_length=160)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=40)
    website: str | None = Field(default=None, max_length=255)
    address: str | None = None
    default_currency: str = Field(min_length=3, max_length=3)
    timezone: str = Field(min_length=1, max_length=60)

    @field_validator("default_currency")
    @classmethod
    def uppercase_currency(cls, value: str) -> str:
        return value.upper()

    @field_validator("legal_name", "phone", "website", "address")
    @classmethod
    def blank_to_none(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None


class OrganizationOut(ApiModel):
    id: int
    name: str
    legal_name: str | None = None
    email: str | None = None
    phone: str | None = None
    website: str | None = None
    address: str | None = None
    default_currency: str
    timezone: str
    created_at: datetime
    updated_at: datetime
