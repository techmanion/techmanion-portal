from datetime import date

from fastapi import APIRouter

from app.api.dependencies import CurrentUser, DbSession
from app.schemas import ActivityListOut
from app.services.activity import list_activity

router = APIRouter(prefix="/activity", tags=["activity"])


@router.get("", response_model=ActivityListOut)
def get_activity(
    db: DbSession,
    _: CurrentUser,
    entity_type: str | None = None,
    action: str | None = None,
    user_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    page: int = 1,
    page_size: int = 25,
) -> ActivityListOut:
    return list_activity(
        db,
        entity_type=entity_type,
        action=action,
        performed_by_user_id=user_id,
        date_from=date_from,
        date_to=date_to,
        page=page,
        page_size=page_size,
    )
