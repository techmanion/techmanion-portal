from fastapi import APIRouter

from app.api.dependencies import DbSession, ExecutiveUser
from app.models import CompanyProfile
from app.schemas import OrganizationOut, OrganizationUpdate

router = APIRouter(tags=["organization"])


@router.put("/organization", response_model=OrganizationOut)
def update_organization(payload: OrganizationUpdate, db: DbSession, _: ExecutiveUser) -> CompanyProfile:
    profile = db.get(CompanyProfile, 1)
    for field, value in payload.model_dump().items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile
