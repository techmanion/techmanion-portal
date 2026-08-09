from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import Project, ProjectPayment


def project_detail_options():
    return (
        selectinload(Project.milestones),
        selectinload(Project.payments).selectinload(ProjectPayment.bank_transaction),
    )


def list_projects_detailed(db: Session) -> list[Project]:
    statement = select(Project).options(*project_detail_options()).order_by(Project.name)
    return list(db.scalars(statement).all())


def get_project_detailed(db: Session, project_id: int) -> Project | None:
    statement = (
        select(Project)
        .where(Project.id == project_id)
        .options(*project_detail_options())
    )
    return db.scalar(statement)
