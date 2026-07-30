from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload

from app.api.dependencies import AdminUser, CurrentUser, DbSession
from app.core.errors import get_or_404
from app.models import Employee, Project, ProjectAssignment
from app.repositories.projects import get_project_detailed
from app.schemas import (
    AssignmentOut,
    ProjectAssignmentCreate,
    ProjectCreate,
    ProjectOut,
    ProjectUpdate,
)
from app.services import assign_employee as assign_employee_service
from app.services import remove_assignment as remove_assignment_service
from app.services.activity import log_activity

router = APIRouter(tags=["projects"])


def serialize_project(project: Project) -> ProjectOut:
    assignments = [
        AssignmentOut(
            id=item.id,
            employee_id=item.employee_id,
            employee_name=item.employee.full_name,
        )
        for item in project.assignments
    ]
    return ProjectOut(
        **{column.name: getattr(project, column.name) for column in Project.__table__.columns},
        assignments=assignments,
    )


@router.get("/projects", response_model=list[ProjectOut])
def list_projects(db: DbSession, _: CurrentUser) -> list[ProjectOut]:
    projects = db.scalars(
        select(Project)
        .options(selectinload(Project.assignments).selectinload(ProjectAssignment.employee))
        .order_by(Project.name)
    ).all()
    return [serialize_project(project) for project in projects]


@router.post("/projects", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(payload: ProjectCreate, db: DbSession, user: AdminUser) -> ProjectOut:
    project = Project(**payload.model_dump())
    db.add(project)
    try:
        db.flush()
        log_activity(db, "Project", project.id, "CREATE", f"Created project {project.name}")
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409, detail="A project with this name already exists."
        ) from exc
    return serialize_project(project)


@router.get("/projects/{project_id}", response_model=ProjectOut)
def get_project(project_id: int, db: DbSession, _: CurrentUser) -> ProjectOut:
    project = get_project_detailed(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project was not found.")
    return serialize_project(project)


@router.put("/projects/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: int, payload: ProjectUpdate, db: DbSession, user: AdminUser
) -> ProjectOut:
    project = get_or_404(db, Project, project_id, "Project was not found.")
    for key, value in payload.model_dump().items():
        setattr(project, key, value)
    log_activity(db, "Project", project.id, "UPDATE", f"Updated project {project.name}")
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409, detail="A project with this name already exists."
        ) from exc
    return serialize_project(get_project_detailed(db, project_id))


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: int, db: DbSession, user: AdminUser) -> None:
    project = get_or_404(db, Project, project_id, "Project was not found.")
    log_activity(db, "Project", project.id, "DELETE", f"Deleted project {project.name}")
    db.delete(project)
    db.commit()


@router.post("/projects/{project_id}/assignments", response_model=ProjectOut)
def assign_employee(
    project_id: int,
    payload: ProjectAssignmentCreate,
    db: DbSession,
    user: AdminUser,
) -> ProjectOut:
    project = db.get(Project, project_id)
    employee = db.get(Employee, payload.employee_id)
    if not project or not employee:
        raise HTTPException(status_code=404, detail="Project or employee was not found.")
    assign_employee_service(db, project, employee)
    return serialize_project(get_project_detailed(db, project_id))


@router.delete("/projects/{project_id}/assignments/{assignment_id}", response_model=ProjectOut)
def remove_assignment(
    project_id: int, assignment_id: int, db: DbSession, user: AdminUser
) -> ProjectOut:
    assignment = db.scalar(
        select(ProjectAssignment).where(
            ProjectAssignment.id == assignment_id,
            ProjectAssignment.project_id == project_id,
        )
    )
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment was not found.")
    remove_assignment_service(db, assignment)
    return serialize_project(get_project_detailed(db, project_id))
