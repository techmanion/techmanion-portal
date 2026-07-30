from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import Candidate


def get_candidate_detailed(db: Session, candidate_id: int) -> Candidate | None:
    """Load a candidate with its job relation for serialization."""
    statement = (
        select(Candidate).where(Candidate.id == candidate_id).options(selectinload(Candidate.job))
    )
    return db.scalar(statement)
