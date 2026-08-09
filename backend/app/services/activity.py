from __future__ import annotations

from datetime import date
from typing import Any

from sqlalchemy.orm import Session

from app.models import ActivityLog
from app.repositories.activity import list_activity_logs
from app.schemas.activity import ActivityListOut, ActivityOut


def log_activity(
    db: Session,
    entity_type: str,
    entity_id: int | str,
    action: str,
    description: str,
    *,
    performed_by_user_id: int | None = None,
    metadata: dict[str, Any] | None = None,
) -> ActivityLog:
    log = ActivityLog(
        entity_type=entity_type,
        entity_id=str(entity_id),
        action=action,
        description=description,
        performed_by_user_id=performed_by_user_id,
        metadata_json=metadata,
    )
    db.add(log)
    return log


def list_activity(
    db: Session,
    *,
    entity_type: str | None = None,
    action: str | None = None,
    performed_by_user_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    page: int = 1,
    page_size: int = 25,
) -> ActivityListOut:
    page = max(page, 1)
    page_size = min(max(page_size, 1), 100)
    rows, total = list_activity_logs(
        db,
        entity_type=entity_type,
        action=action,
        performed_by_user_id=performed_by_user_id,
        date_from=date_from,
        date_to=date_to,
        limit=page_size,
        offset=(page - 1) * page_size,
    )
    return ActivityListOut(
        items=[ActivityOut.model_validate(row) for row in rows],
        total=total,
        page=page,
        page_size=page_size,
    )
