from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import or_, select
from sqlalchemy.orm import selectinload

from app.api.dependencies import CurrentUser, DbSession
from app.config import settings
from app.core.errors import get_or_404
from app.models import Employee, EmployeeDocument, EmployeeStatus
from app.repositories.employees import get_employee_detailed
from app.schemas import (
    DocumentOut,
    EmployeeCreate,
    EmployeeOut,
    EmployeeUpdate,
    SalaryCreate,
    SalaryOut,
)
from app.services import add_salary_revision as add_salary_revision_service
from app.services import create_employee as create_employee_service
from app.services import employee_current_salary
from app.services import update_employee as update_employee_service

router = APIRouter(tags=["employees"])


def serialize_employee(employee: Employee) -> EmployeeOut:
    salary = employee_current_salary(employee)
    return EmployeeOut(
        **{column.name: getattr(employee, column.name) for column in Employee.__table__.columns},
        full_name=employee.full_name,
        designation=employee.designation,
        current_salary=salary,
    )


@router.get("/employees", response_model=list[EmployeeOut])
def list_employees(
    db: DbSession,
    _: CurrentUser,
    search: str = "",
    status_filter: EmployeeStatus | None = None,
    designation_id: int | None = None,
) -> list[EmployeeOut]:
    statement = (
        select(Employee)
        .options(
            selectinload(Employee.designation),
            selectinload(Employee.salary_revisions),
        )
        .order_by(Employee.first_name, Employee.last_name)
    )
    if search:
        term = f"%{search}%"
        statement = statement.where(
            or_(
                Employee.first_name.ilike(term),
                Employee.last_name.ilike(term),
                Employee.email.ilike(term),
            )
        )
    if status_filter:
        statement = statement.where(Employee.status == status_filter)
    if designation_id:
        statement = statement.where(Employee.designation_id == designation_id)
    return [serialize_employee(row) for row in db.scalars(statement).all()]


@router.post("/employees", response_model=EmployeeOut, status_code=status.HTTP_201_CREATED)
def create_employee(payload: EmployeeCreate, db: DbSession, user: CurrentUser) -> EmployeeOut:
    employee = create_employee_service(db, payload, user)
    return serialize_employee(get_employee_detailed(db, employee.id))


@router.get("/employees/{employee_id}", response_model=EmployeeOut)
def get_employee(employee_id: int, db: DbSession, _: CurrentUser) -> EmployeeOut:
    employee = get_employee_detailed(db, employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee was not found.")
    return serialize_employee(employee)


@router.put("/employees/{employee_id}", response_model=EmployeeOut)
def update_employee(
    employee_id: int, payload: EmployeeUpdate, db: DbSession, _: CurrentUser
) -> EmployeeOut:
    employee = get_or_404(db, Employee, employee_id, "Employee was not found.")
    update_employee_service(db, employee, payload)
    return serialize_employee(get_employee_detailed(db, employee_id))


@router.post("/employees/{employee_id}/salary", response_model=SalaryOut)
def add_salary_revision(
    employee_id: int, payload: SalaryCreate, db: DbSession, user: CurrentUser
) -> SalaryOut:
    employee = get_or_404(db, Employee, employee_id, "Employee was not found.")
    return add_salary_revision_service(db, employee, payload, user)


@router.get("/employees/{employee_id}/documents", response_model=list[DocumentOut])
def list_documents(employee_id: int, db: DbSession, _: CurrentUser) -> list[EmployeeDocument]:
    return list(
        db.scalars(
            select(EmployeeDocument)
            .where(EmployeeDocument.employee_id == employee_id)
            .order_by(EmployeeDocument.created_at.desc())
        ).all()
    )


@router.post(
    "/employees/{employee_id}/documents",
    response_model=DocumentOut,
    status_code=status.HTTP_201_CREATED,
)
async def upload_document(
    employee_id: int,
    db: DbSession,
    user: CurrentUser,
    kind: str = Form(...),
    file: UploadFile = File(...),
) -> EmployeeDocument:
    if not db.get(Employee, employee_id):
        raise HTTPException(status_code=404, detail="Employee was not found.")
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Files must be 10 MB or smaller.")
    extension = Path(file.filename or "").suffix
    key = f"{employee_id}/{uuid4().hex}{extension}"
    destination = settings.upload_dir / key
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(contents)
    document = EmployeeDocument(
        employee_id=employee_id,
        kind=kind,
        file_key=key,
        file_name=file.filename or "document",
        mime_type=file.content_type or "application/octet-stream",
        size_bytes=len(contents),
        uploaded_by_user_id=user.id,
    )
    db.add(document)
    db.commit()
    db.refresh(document)
    return document


@router.get("/documents/{document_id}/download")
def download_document(document_id: int, db: DbSession, _: CurrentUser) -> FileResponse:
    document = get_or_404(db, EmployeeDocument, document_id, "Document was not found.")
    path = settings.upload_dir / document.file_key
    if not path.exists():
        raise HTTPException(status_code=404, detail="Stored file is unavailable.")
    return FileResponse(path, media_type=document.mime_type, filename=document.file_name)
