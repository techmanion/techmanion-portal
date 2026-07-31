from fastapi import APIRouter

from app.api.dependencies import AdminUser, CurrentUser, DbSession
from app.models import CompanyProfile
from app.schemas import OrganizationOut, OrganizationUpdate

router = APIRouter(tags=["organization"])


@router.get("/organization", response_model=OrganizationOut)
def get_organization(db: DbSession, _: CurrentUser) -> CompanyProfile:
    return db.get(CompanyProfile, 1)


@router.put("/organization", response_model=OrganizationOut)
def update_organization(payload: OrganizationUpdate, db: DbSession, _: AdminUser) -> CompanyProfile:
    profile = db.get(CompanyProfile, 1)
    for field, value in payload.model_dump().items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return profile
