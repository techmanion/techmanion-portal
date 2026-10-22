from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.auth import User
from app.models.leads import Lead
from app.schemas.leads import LeadCreate, LeadStatusUpdate
from app.services.activity import log_activity


def create_lead(db: Session, payload: LeadCreate) -> Lead:
    lead = Lead(
        name=payload.name,
        email=payload.email,
        company=payload.company,
        goal=payload.goal,
        audience=payload.audience,
    )
    db.add(lead)
    db.flush()
    log_activity(
        db,
        "Lead",
        lead.id,
        "CREATE",
        f"New {payload.audience.value.lower()} inquiry from {lead.name} ({lead.email})",
    )
    db.commit()
    db.refresh(lead)
    return lead


def update_lead_status(
    db: Session, lead: Lead, payload: LeadStatusUpdate, actor: User
) -> Lead:
    lead.status = payload.status
    log_activity(
        db,
        "Lead",
        lead.id,
        "UPDATE",
        f"Marked lead from {lead.name} as {payload.status.value.lower()}",
        performed_by_user_id=actor.id,
    )
    db.commit()
    db.refresh(lead)
    return lead
