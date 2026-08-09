from datetime import date

from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import (
    EMPLOYEE_ID_FORMATS,
    Employee,
    EmployeeIdentifier,
    EmployeeIdSequence,
    EmployeeType,
    SalaryRevision,
    User,
    utc_now,
)
from app.schemas import EmployeeCreate, EmployeeUpdate, SalaryCreate
from app.services.activity import log_activity


def employee_current_salary(
    employee: Employee, on_date: date | None = None
) -> SalaryRevision | None:
    target = on_date or date.today()
    eligible = [row for row in employee.salary_revisions if row.effective_date <= target]
    return max(eligible, key=lambda row: row.effective_date) if eligible else None


def _next_employee_code(db: Session, employee_type: EmployeeType) -> str:
    prefix, width = EMPLOYEE_ID_FORMATS[employee_type]
    sequence = db.get(EmployeeIdSequence, employee_type)
    if sequence is None:
        sequence = EmployeeIdSequence(employee_type=employee_type, last_number=0)
        db.add(sequence)
        db.flush()
    sequence.last_number += 1
    db.flush()
    return f"TM-{prefix}-{sequence.last_number:0{width}d}"


def issue_employee_identifier(
    db: Session, employee: Employee, employee_type: EmployeeType
) -> EmployeeIdentifier:
    """Issue the next permanent ID for a type. Retiring any prior active ID is the caller's job."""
    code = _next_employee_code(db, employee_type)
    identifier = EmployeeIdentifier(
        employee_id=employee.id, employee_type=employee_type, code=code
    )
    db.add(identifier)
    db.flush()
    return identifier


def _retire_current_identifier(employee: Employee) -> None:
    current = employee.current_identifier
    if current is not None:
        current.retired_at = utc_now()


def create_employee(db: Session, payload: EmployeeCreate, actor: User) -> Employee:
    data = payload.model_dump(exclude={"base_amount", "currency"})
    data["cnic"] = data.get("cnic") or f"PENDING-{uuid4().hex[:10].upper()}"
    employee = Employee(**data)
    db.add(employee)
    try:
        db.flush()
        issue_employee_identifier(db, employee, employee.employee_type)
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
        log_activity(
            db,
            "Employee",
            employee.id,
            "CREATE",
            f"Added employee {employee.full_name}",
            performed_by_user_id=actor.id,
        )
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email or CNIC is already in use.") from exc
    return employee


def update_employee(
    db: Session, employee: Employee, payload: EmployeeUpdate, actor: User | None = None
) -> Employee:
    type_changed = payload.employee_type != employee.employee_type
    for key, value in payload.model_dump().items():
        setattr(employee, key, value)
    if type_changed:
        _retire_current_identifier(employee)
        issue_employee_identifier(db, employee, payload.employee_type)
        log_activity(
            db,
            "Employee",
            employee.id,
            "UPDATE",
            f"Reissued employee ID for {employee.full_name} ({payload.employee_type.value})",
            performed_by_user_id=actor.id if actor else None,
        )
    log_activity(
        db,
        "Employee",
        employee.id,
        "UPDATE",
        f"Updated employee {employee.full_name}",
        performed_by_user_id=actor.id if actor else None,
    )
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
        db,
        "Employee",
        employee.id,
        "UPDATE",
        f"Updated compensation for {employee.full_name}",
        performed_by_user_id=actor.id,
    )
    db.commit()
    db.refresh(revision)
    return revision
