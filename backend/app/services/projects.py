from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Employee, Project, ProjectAssignment
from app.services.activity import log_activity


def assign_employee(db: Session, project: Project, employee: Employee) -> None:
    db.add(ProjectAssignment(project_id=project.id, employee_id=employee.id))
    log_activity(
        db, "Project", project.id, "UPDATE", f"Assigned {employee.full_name} to {project.name}"
    )
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Employee is already assigned.") from exc


def remove_assignment(db: Session, assignment: ProjectAssignment) -> None:
    employee_name = assignment.employee.full_name
    project_name = assignment.project.name
    project_id = assignment.project_id
    db.delete(assignment)
    log_activity(
        db, "Project", project_id, "UPDATE", f"Removed {employee_name} from {project_name}"
    )
    db.commit()
