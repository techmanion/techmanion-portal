from datetime import date
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Employee, SalaryRevision, User
from app.schemas import EmployeeCreate, EmployeeUpdate, SalaryCreate
from app.services.activity import log_activity


def employee_current_salary(
    employee: Employee, on_date: date | None = None
) -> SalaryRevision | None:
    target = on_date or date.today()
    eligible = [row for row in employee.salary_revisions if row.effective_date <= target]
    return max(eligible, key=lambda row: row.effective_date) if eligible else None


def create_employee(db: Session, payload: EmployeeCreate, actor: User) -> Employee:
    data = payload.model_dump(exclude={"base_amount", "currency"})
    data["cnic"] = data.get("cnic") or f"PENDING-{uuid4().hex[:10].upper()}"
    employee = Employee(**data)
    db.add(employee)
    try:
        db.flush()
        db.add(
            SalaryRevision(
                employee_id=employee.id,
                base_amount=payload.base_amount,
                currency=payload.currency,
                effective_date=payload.joining_date,
                reason="HIRE",
                created_by_user_id=actor.id,
            )
        )
        log_activity(db, "Employee", employee.id, "CREATE", f"Added employee {employee.full_name}")
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email or CNIC is already in use.") from exc
    return employee


def update_employee(db: Session, employee: Employee, payload: EmployeeUpdate) -> Employee:
    for key, value in payload.model_dump().items():
        setattr(employee, key, value)
    log_activity(db, "Employee", employee.id, "UPDATE", f"Updated employee {employee.full_name}")
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email or CNIC is already in use.") from exc
    return employee


def add_salary_revision(
    db: Session, employee: Employee, payload: SalaryCreate, actor: User
) -> SalaryRevision:
    revision = SalaryRevision(
        employee_id=employee.id,
        created_by_user_id=actor.id,
        **payload.model_dump(),
    )
    db.add(revision)
    log_activity(
        db, "Employee", employee.id, "UPDATE", f"Updated compensation for {employee.full_name}"
    )
    db.commit()
    db.refresh(revision)
    return revision
