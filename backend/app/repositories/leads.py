from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.leads import Lead, LeadStatus


def list_leads(db: Session, *, status: LeadStatus | None = None) -> list[Lead]:
    statement = select(Lead).order_by(Lead.created_at.desc())
    if status:
        statement = statement.where(Lead.status == status)
    return list(db.scalars(statement).all())
