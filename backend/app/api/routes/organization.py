from fastapi import APIRouter

from app.api.dependencies import DbSession, ExecutiveUser
from app.models import CompanyProfile
from app.schemas import OrganizationOut, OrganizationUpdate
from app.services.activity import log_activity

router = APIRouter(tags=["organization"])


@router.put("/organization", response_model=OrganizationOut)
def update_organization(
    payload: OrganizationUpdate, db: DbSession, user: ExecutiveUser
) -> CompanyProfile:
    profile = db.get(CompanyProfile, 1)
    for field, value in payload.model_dump().items():
        setattr(profile, field, value)
    log_activity(
        db,
        "Organization",
        profile.id,
        "UPDATE",
        "Updated organization profile",
        performed_by_user_id=user.id,
    )
    db.commit()
    db.refresh(profile)
    return profile
