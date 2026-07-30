from fastapi import APIRouter

from app.api.dependencies import CurrentUser, DbSession
from app.schemas import HomeOut
from app.services import build_home_feed

router = APIRouter(tags=["home"])


@router.get("/home", response_model=HomeOut)
def get_home(db: DbSession, _: CurrentUser) -> HomeOut:
    return build_home_feed(db)
