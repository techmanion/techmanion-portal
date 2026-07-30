from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Candidate, CandidateStage, Designation, Employee, SalaryRevision, User
from app.schemas import ConvertToEmployeePayload
from app.services.activity import log_activity


def convert_candidate_to_employee(
    db: Session, candidate: Candidate, payload: ConvertToEmployeePayload, actor: User
) -> Employee:
    if candidate.stage == CandidateStage.HIRED:
        raise HTTPException(status_code=409, detail="Candidate has already been converted.")
    if payload.designation_id and not db.get(Designation, payload.designation_id):
        raise HTTPException(status_code=404, detail="Designation was not found.")

    name_parts = candidate.full_name.strip().split(" ", 1)
    employee = Employee(
        first_name=name_parts[0],
        last_name=name_parts[1] if len(name_parts) > 1 else "",
        cnic=f"PENDING-{uuid4().hex[:10].upper()}",
        email=candidate.email,
        phone=candidate.phone or "",
        employee_type=payload.employee_type,
        joining_date=payload.joining_date,
        designation_id=payload.designation_id,
    )
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
        candidate.stage = CandidateStage.HIRED
        log_activity(
            db,
            "Candidate",
            candidate.id,
            "CONVERT",
            f"Converted {candidate.full_name} to an employee",
        )
        log_activity(
            db,
            "Employee",
            employee.id,
            "CREATE",
            f"Added employee {employee.full_name} from Hiring",
        )
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409, detail="Email is already in use by an employee."
        ) from exc
    return employee
