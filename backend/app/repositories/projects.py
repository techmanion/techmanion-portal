from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import Project, ProjectAssignment


def get_project_detailed(db: Session, project_id: int) -> Project | None:
    """Load a project with assignments and their employees for serialization."""
    statement = (
        select(Project)
        .where(Project.id == project_id)
        .options(selectinload(Project.assignments).selectinload(ProjectAssignment.employee))
    )
    return db.scalar(statement)
