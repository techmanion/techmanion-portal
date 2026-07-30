from sqlalchemy.orm import Session

from app.models import ActivityLog


def log_activity(
    db: Session,
    entity: str,
    entity_id: int | str,
    action: str,
    description: str,
) -> None:
    db.add(
        ActivityLog(
            entity=entity,
            entity_id=str(entity_id),
            action=action,
            description=description,
        )
    )
