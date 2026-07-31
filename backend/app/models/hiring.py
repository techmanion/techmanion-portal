from __future__ import annotations

from datetime import date
from enum import Enum

from sqlalchemy import JSON, Date, ForeignKey, String, Text
from sqlalchemy import Enum as SqlEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.models.common import TimestampMixin


class JobStatus(str, Enum):
    OPEN = "OPEN"
    CLOSED = "CLOSED"


class CandidateStage(str, Enum):
    APPLIED = "APPLIED"
    SCREENING = "SCREENING"
    INTERVIEW = "INTERVIEW"
    OFFER = "OFFER"
    HIRED = "HIRED"
    REJECTED = "REJECTED"


class Job(TimestampMixin, Base):
    __tablename__ = "jobs"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(160))
    department: Mapped[str] = mapped_column(String(120))
    location: Mapped[str] = mapped_column(String(160))
    job_type: Mapped[str] = mapped_column(String(80))
    summary: Mapped[str] = mapped_column(Text)
    description: Mapped[str] = mapped_column(Text)
    responsibilities: Mapped[list[str]] = mapped_column(JSON, default=list)
    requirements: Mapped[list[str]] = mapped_column(JSON, default=list)
    application_link: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[JobStatus] = mapped_column(SqlEnum(JobStatus), default=JobStatus.OPEN)

    candidates: Mapped[list[Candidate]] = relationship(
        back_populates="job", cascade="all, delete-orphan"
    )


class Candidate(TimestampMixin, Base):
    __tablename__ = "candidates"

    id: Mapped[int] = mapped_column(primary_key=True)
    full_name: Mapped[str] = mapped_column(String(160))
    email: Mapped[str] = mapped_column(String(320), index=True)
    phone: Mapped[str | None] = mapped_column(String(40), nullable=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("jobs.id", ondelete="CASCADE"))
    stage: Mapped[CandidateStage] = mapped_column(
        SqlEnum(CandidateStage), default=CandidateStage.APPLIED
    )
    resume: Mapped[str | None] = mapped_column(String(500), nullable=True)
    interview_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    job: Mapped[Job] = relationship(back_populates="candidates")
