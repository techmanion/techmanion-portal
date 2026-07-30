from datetime import date, datetime

from app.schemas.common import ApiModel


class ActivityOut(ApiModel):
    id: int
    entity: str
    entity_id: str
    action: str
    description: str
    timestamp: datetime


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
