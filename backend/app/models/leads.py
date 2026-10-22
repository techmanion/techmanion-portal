from __future__ import annotations

from enum import Enum

from sqlalchemy import String, Text
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.common import TimestampMixin

__all__ = ["Lead", "LeadAudience", "LeadStatus"]


class LeadAudience(str, Enum):
    FOUNDER = "FOUNDER"
    BUSINESS = "BUSINESS"


class LeadStatus(str, Enum):
    NEW = "NEW"
    CONTACTED = "CONTACTED"
    QUALIFIED = "QUALIFIED"
    ARCHIVED = "ARCHIVED"


class Lead(TimestampMixin, Base):
    """A visitor-submitted inquiry from the public site's contact form."""

    __tablename__ = "leads"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(160))
    email: Mapped[str] = mapped_column(String(255), index=True)
    company: Mapped[str | None] = mapped_column(String(160), nullable=True)
    goal: Mapped[str | None] = mapped_column(Text, nullable=True)
    audience: Mapped[LeadAudience] = mapped_column(SqlEnum(LeadAudience))
    status: Mapped[LeadStatus] = mapped_column(SqlEnum(LeadStatus), default=LeadStatus.NEW)
