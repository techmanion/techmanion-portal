from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import PayrollEntry


def get_payroll_entry_detailed(db: Session, entry_id: int) -> PayrollEntry | None:
    """Load a payroll entry with its employee relation for serialization."""
    statement = (
        select(PayrollEntry)
        .where(PayrollEntry.id == entry_id)
        .options(selectinload(PayrollEntry.employee))
    )
    return db.scalar(statement)
