from fastapi import APIRouter, Query

from app.api.dependencies import CurrentUser, DbSession
from app.core.errors import get_or_404
from app.models.leads import Lead, LeadStatus
from app.repositories.leads import list_leads
from app.schemas.leads import LeadOut, LeadStatusUpdate
from app.services import update_lead_status

router = APIRouter(prefix="/leads", tags=["leads"])


@router.get("", response_model=list[LeadOut])
def list_all_leads(
    db: DbSession,
    _: CurrentUser,
    status_filter: LeadStatus | None = Query(default=None, alias="status"),
) -> list[LeadOut]:
    return [LeadOut.model_validate(lead) for lead in list_leads(db, status=status_filter)]


@router.get("/{lead_id}", response_model=LeadOut)
def get_lead(lead_id: int, db: DbSession, _: CurrentUser) -> LeadOut:
    lead = get_or_404(db, Lead, lead_id, "Lead was not found.")
    return LeadOut.model_validate(lead)


@router.patch("/{lead_id}/status", response_model=LeadOut)
def patch_lead_status(
    lead_id: int, payload: LeadStatusUpdate, db: DbSession, user: CurrentUser
) -> LeadOut:
    lead = get_or_404(db, Lead, lead_id, "Lead was not found.")
    updated = update_lead_status(db, lead, payload, user)
    return LeadOut.model_validate(updated)
