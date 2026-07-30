from fastapi import APIRouter
from sqlalchemy import select

from app.api.dependencies import AdminUser, CurrentUser, DbSession
from app.models import Department, Designation
from app.schemas import NamedOption

router = APIRouter(tags=["settings"])


@router.get("/settings/departments", response_model=list[NamedOption])
def list_departments(db: DbSession, _: CurrentUser) -> list[Department]:
    return list(db.scalars(select(Department).order_by(Department.name)).all())


@router.post("/settings/departments", response_model=NamedOption)
def add_department(name: str, db: DbSession, _: AdminUser) -> Department:
    department = Department(name=name.strip())
    db.add(department)
    db.commit()
    db.refresh(department)
    return department


@router.get("/settings/designations", response_model=list[NamedOption])
def list_designations(db: DbSession, _: CurrentUser) -> list[Designation]:
    return list(db.scalars(select(Designation).order_by(Designation.name)).all())


@router.post("/settings/designations", response_model=NamedOption)
def add_designation(name: str, db: DbSession, _: AdminUser) -> Designation:
    designation = Designation(name=name.strip())
    db.add(designation)
    db.commit()
    db.refresh(designation)
    return designation
