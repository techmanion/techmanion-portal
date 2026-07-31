from __future__ import annotations

from sqlalchemy import Boolean, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.common import TimestampMixin


class Department(TimestampMixin, Base):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class Designation(TimestampMixin, Base):
    __tablename__ = "designations"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)


class CompanyProfile(TimestampMixin, Base):
    __tablename__ = "company_profiles"

    id: Mapped[int] = mapped_column(primary_key=True, default=1)
    name: Mapped[str] = mapped_column(String(160), default="Techmanion")
    legal_name: Mapped[str | None] = mapped_column(String(160), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(40), nullable=True)
    website: Mapped[str | None] = mapped_column(String(255), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    default_currency: Mapped[str] = mapped_column(String(3), default="PKR")
    timezone: Mapped[str] = mapped_column(String(60), default="UTC")
    logo_text: Mapped[str] = mapped_column(String(80), default="Techmanion")
