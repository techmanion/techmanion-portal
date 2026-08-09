from datetime import date

from app.schemas.activity import ActivityOut
from app.schemas.common import ApiModel

__all__ = ["ActivityOut", "HomeItem", "HomeOut"]


class HomeItem(ApiModel):
    kind: str
    title: str
    description: str
    event_date: date | None = None
    href: str


class HomeOut(ApiModel):
    needs_attention: list[HomeItem]
    upcoming: list[HomeItem]
    recent_activity: list[ActivityOut]
