from typing import TypeVar

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.database import Base

ModelT = TypeVar("ModelT", bound=Base)


def get_or_404(db: Session, model: type[ModelT], entity_id: int, detail: str) -> ModelT:
    """Fetch a row by primary key or raise the standard 404 used across every route."""
    obj = db.get(model, entity_id)
    if not obj:
        raise HTTPException(status_code=404, detail=detail)
    return obj
