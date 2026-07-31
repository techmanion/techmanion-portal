from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import Employee


def get_employee_detailed(db: Session, employee_id: int) -> Employee | None:
    """Load an employee with the relations every serializer/route needs."""
    statement = (
        select(Employee)
        .where(Employee.id == employee_id)
        .options(
            selectinload(Employee.designation),
            selectinload(Employee.salary_revisions),
            selectinload(Employee.identifiers),
        )
    )
    return db.scalar(statement)
