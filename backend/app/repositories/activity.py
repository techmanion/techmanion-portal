from __future__ import annotations

from datetime import UTC, date, datetime, time

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models import ActivityLog


def list_activity_logs(
    db: Session,
    *,
    entity_type: str | None = None,
    action: str | None = None,
    performed_by_user_id: int | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    limit: int = 25,
    offset: int = 0,
) -> tuple[list[ActivityLog], int]:
    conditions = []
    if entity_type:
        conditions.append(ActivityLog.entity_type == entity_type)
    if action:
        conditions.append(ActivityLog.action == action)
    if performed_by_user_id:
        conditions.append(ActivityLog.performed_by_user_id == performed_by_user_id)
    if date_from:
        conditions.append(
            ActivityLog.timestamp >= datetime.combine(date_from, time.min, tzinfo=UTC)
        )
    if date_to:
        conditions.append(
            ActivityLog.timestamp <= datetime.combine(date_to, time.max, tzinfo=UTC)
        )

    total = db.scalar(select(func.count()).select_from(ActivityLog).where(*conditions)) or 0
    rows = db.scalars(
        select(ActivityLog)
        .where(*conditions)
        .options(selectinload(ActivityLog.performed_by))
        .order_by(ActivityLog.timestamp.desc(), ActivityLog.id.desc())
        .limit(limit)
        .offset(offset)
    ).all()
    return list(rows), total
