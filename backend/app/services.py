from datetime import date

from sqlalchemy.orm import Session

from app.models import ActivityLog, Employee, SalaryRevision


def employee_current_salary(
    employee: Employee, on_date: date | None = None
) -> SalaryRevision | None:
    target = on_date or date.today()
    eligible = [row for row in employee.salary_revisions if row.effective_date <= target]
    return max(eligible, key=lambda row: row.effective_date) if eligible else None


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
