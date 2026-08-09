from __future__ import annotations

from datetime import datetime
from typing import Any

from app.schemas.common import ApiModel


class ActivityOut(ApiModel):
    id: int
    entity_type: str
    entity_id: str
    action: str
    description: str
    timestamp: datetime
    performed_by_user_id: int | None = None
    performed_by_name: str | None = None
    metadata_json: dict[str, Any] | None = None


class ActivityListOut(ApiModel):
    items: list[ActivityOut]
    total: int
    page: int
    page_size: int
