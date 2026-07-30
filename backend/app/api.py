import calendar
from datetime import date, timedelta
from pathlib import Path
from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload

from app.config import settings
from app.dependencies import AdminUser, CurrentUser, DbSession
from app.models import (
    ActivityLog,
    Candidate,
    CandidateStage,
    Department,
    Designation,
    Employee,
    EmployeeDocument,
    EmployeeStatus,
    Job,
    PayrollEntry,
    PayrollEntryStatus,
    Project,
    ProjectAssignment,
    ProjectStatus,
    SalaryRevision,
    User,
    UserRole,
)
from app.schemas import (
    ActivityOut,
    AssignmentOut,
    CandidateCreate,
    CandidateOut,
    CandidateUpdate,
    ConvertToEmployeePayload,
    DocumentOut,
    EmployeeCreate,
    EmployeeOut,
    EmployeeUpdate,
    HomeItem,
    HomeOut,
    JobCreate,
    JobOut,
    JobUpdate,
    NamedOption,
    PasswordChange,
    PayrollEntryCreate,
    PayrollEntryOut,
    PayrollEntryUpdate,
    PayrollMarkPaid,
    ProfileUpdate,
    ProjectAssignmentCreate,
    ProjectCreate,
    ProjectOut,
    ProjectUpdate,
    SalaryCreate,
    SalaryOut,
    TokenOut,
    UserAdminUpdate,
    UserCreate,
    UserOut,
)
from app.security import create_access_token, hash_password, verify_password
from app.services import employee_current_salary, log_activity

router = APIRouter()


def serialize_employee(employee: Employee) -> EmployeeOut:
    salary = employee_current_salary(employee)
    return EmployeeOut(
        **{column.name: getattr(employee, column.name) for column in Employee.__table__.columns},
        full_name=employee.full_name,
        designation=employee.designation,
        current_salary=salary,
    )


def serialize_candidate(candidate: Candidate) -> CandidateOut:
    return CandidateOut(
        **{
            column.name: getattr(candidate, column.name)
            for column in Candidate.__table__.columns
        },
        job_title=candidate.job.title,
    )


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


def serialize_payroll_entry(entry: PayrollEntry) -> PayrollEntryOut:
    return PayrollEntryOut(
        id=entry.id,
        employee_id=entry.employee_id,
        employee_name=entry.employee.full_name,
        month=entry.month,
        base_compensation=entry.base_compensation,
        adjustment=entry.adjustment,
        final_amount=entry.final_amount,
        currency=entry.currency,
        status=entry.status,
        payment_date=entry.payment_date,
        notes=entry.notes,
    )


def payroll_period_end(month: str) -> date:
    try:
        year, month_number = (int(part) for part in month.split("-"))
        return date(year, month_number, calendar.monthrange(year, month_number)[1])
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=422,
            detail="Month must use YYYY-MM format.",
        ) from None


@router.post("/auth/login", response_model=TokenOut)
def login(form: Annotated[OAuth2PasswordRequestForm, Depends()], db: DbSession) -> TokenOut:
    user = db.scalar(select(User).where(User.email == form.username.lower()))
    if not user or not user.is_active or not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email or password is incorrect.")
    return TokenOut(access_token=create_access_token(user.id), user=UserOut.model_validate(user))


@router.get("/auth/me", response_model=UserOut)
def me(user: CurrentUser) -> User:
    return user


@router.patch("/auth/me", response_model=UserOut)
def update_profile(payload: ProfileUpdate, db: DbSession, user: CurrentUser) -> User:
    user.name = payload.name.strip()
    db.commit()
    db.refresh(user)
    return user


@router.post("/auth/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(payload: PasswordChange, db: DbSession, user: CurrentUser) -> None:
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
    user.password_hash = hash_password(payload.new_password)
    db.commit()


@router.get("/users", response_model=list[UserOut])
def list_users(db: DbSession, _: AdminUser) -> list[User]:
    return list(db.scalars(select(User).order_by(User.name)).all())


@router.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreate, db: DbSession, admin: AdminUser) -> User:
    new_user = User(
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        name=payload.name.strip(),
        role=payload.role,
    )
    db.add(new_user)
    try:
        db.flush()
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="A user with this email already exists.") from exc
    db.refresh(new_user)
    return new_user


@router.patch("/users/{user_id}", response_model=UserOut)
def update_user(user_id: int, payload: UserAdminUpdate, db: DbSession, admin: AdminUser) -> User:
    target = db.get(User, user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User was not found.")
    demoting_self = target.id == admin.id and payload.role is not None and payload.role != UserRole.ADMIN
    deactivating_self = target.id == admin.id and payload.is_active is False
    if demoting_self or deactivating_self:
        raise HTTPException(status_code=400, detail="You cannot revoke your own admin access.")
    if payload.role is not None:
        target.role = payload.role
    if payload.is_active is not None:
        target.is_active = payload.is_active
    db.commit()
    db.refresh(target)
    return target


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
    data = payload.model_dump(exclude={"base_amount", "currency"})
    data["cnic"] = data.get("cnic") or f"PENDING-{uuid4().hex[:10].upper()}"
    employee = Employee(**data)
    db.add(employee)
    try:
        db.flush()
        revision = SalaryRevision(
            employee_id=employee.id,
            base_amount=payload.base_amount,
            currency=payload.currency,
            effective_date=payload.joining_date,
            reason="HIRE",
            created_by_user_id=user.id,
        )
        db.add(revision)
        log_activity(
            db,
            "Employee",
            employee.id,
            "CREATE",
            f"Added employee {employee.full_name}",
        )
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email or CNIC is already in use.") from exc
    statement = (
        select(Employee)
        .where(Employee.id == employee.id)
        .options(
            selectinload(Employee.designation),
            selectinload(Employee.salary_revisions),
        )
    )
    return serialize_employee(db.scalar(statement))


@router.get("/employees/{employee_id}", response_model=EmployeeOut)
def get_employee(employee_id: int, db: DbSession, _: CurrentUser) -> EmployeeOut:
    employee = db.scalar(
        select(Employee)
        .where(Employee.id == employee_id)
        .options(
            selectinload(Employee.designation),
            selectinload(Employee.salary_revisions),
        )
    )
    if not employee:
        raise HTTPException(status_code=404, detail="Employee was not found.")
    return serialize_employee(employee)


@router.put("/employees/{employee_id}", response_model=EmployeeOut)
def update_employee(
    employee_id: int, payload: EmployeeUpdate, db: DbSession, _: CurrentUser
) -> EmployeeOut:
    employee = db.get(Employee, employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee was not found.")
    data = payload.model_dump()
    for key, value in data.items():
        setattr(employee, key, value)
    log_activity(
        db,
        "Employee",
        employee.id,
        "UPDATE",
        f"Updated employee {employee.full_name}",
    )
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email or CNIC is already in use.") from exc
    return get_employee(employee_id, db, _)


@router.post("/employees/{employee_id}/salary", response_model=SalaryOut)
def add_salary_revision(
    employee_id: int, payload: SalaryCreate, db: DbSession, user: CurrentUser
) -> SalaryRevision:
    employee = db.get(Employee, employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee was not found.")
    revision = SalaryRevision(
        employee_id=employee_id,
        created_by_user_id=user.id,
        **payload.model_dump(),
    )
    db.add(revision)
    log_activity(
        db,
        "Employee",
        employee_id,
        "UPDATE",
        f"Updated compensation for {employee.full_name}",
    )
    db.commit()
    db.refresh(revision)
    return revision


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
    document = db.get(EmployeeDocument, document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document was not found.")
    path = settings.upload_dir / document.file_key
    if not path.exists():
        raise HTTPException(status_code=404, detail="Stored file is unavailable.")
    return FileResponse(path, media_type=document.mime_type, filename=document.file_name)


@router.get("/jobs", response_model=list[JobOut])
def list_jobs(db: DbSession, _: CurrentUser) -> list[Job]:
    return list(db.scalars(select(Job).order_by(Job.created_at.desc())).all())


@router.post("/jobs", response_model=JobOut, status_code=status.HTTP_201_CREATED)
def create_job(payload: JobCreate, db: DbSession, user: CurrentUser) -> Job:
    job = Job(**payload.model_dump())
    db.add(job)
    db.flush()
    log_activity(db, "Job", job.id, "CREATE", f"Created job {job.title}")
    db.commit()
    db.refresh(job)
    return job


@router.get("/jobs/{job_id}", response_model=JobOut)
def get_job(job_id: int, db: DbSession, _: CurrentUser) -> Job:
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job was not found.")
    return job


@router.put("/jobs/{job_id}", response_model=JobOut)
def update_job(job_id: int, payload: JobUpdate, db: DbSession, user: CurrentUser) -> Job:
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job was not found.")
    for key, value in payload.model_dump().items():
        setattr(job, key, value)
    log_activity(db, "Job", job.id, "UPDATE", f"Updated job {job.title}")
    db.commit()
    db.refresh(job)
    return job


@router.delete("/jobs/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(job_id: int, db: DbSession, user: CurrentUser) -> None:
    job = db.get(Job, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job was not found.")
    log_activity(db, "Job", job.id, "DELETE", f"Deleted job {job.title}")
    db.delete(job)
    db.commit()


@router.get("/candidates", response_model=list[CandidateOut])
def list_candidates(
    db: DbSession,
    _: CurrentUser,
    search: str = "",
    stage: CandidateStage | None = None,
    job_id: int | None = None,
) -> list[CandidateOut]:
    statement = (
        select(Candidate).options(selectinload(Candidate.job)).order_by(Candidate.created_at.desc())
    )
    if search:
        term = f"%{search}%"
        statement = statement.where(
            or_(Candidate.full_name.ilike(term), Candidate.email.ilike(term))
        )
    if stage:
        statement = statement.where(Candidate.stage == stage)
    if job_id:
        statement = statement.where(Candidate.job_id == job_id)
    return [serialize_candidate(row) for row in db.scalars(statement).all()]


@router.post("/candidates", response_model=CandidateOut, status_code=status.HTTP_201_CREATED)
def create_candidate(payload: CandidateCreate, db: DbSession, user: CurrentUser) -> CandidateOut:
    if not db.get(Job, payload.job_id):
        raise HTTPException(status_code=404, detail="Job was not found.")
    candidate = Candidate(**payload.model_dump())
    db.add(candidate)
    db.flush()
    log_activity(
        db,
        "Candidate",
        candidate.id,
        "CREATE",
        f"Added candidate {candidate.full_name}",
    )
    db.commit()
    candidate = db.scalar(
        select(Candidate).where(Candidate.id == candidate.id).options(selectinload(Candidate.job))
    )
    return serialize_candidate(candidate)


@router.get("/candidates/{candidate_id}", response_model=CandidateOut)
def get_candidate(candidate_id: int, db: DbSession, _: CurrentUser) -> CandidateOut:
    candidate = db.scalar(
        select(Candidate).where(Candidate.id == candidate_id).options(selectinload(Candidate.job))
    )
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate was not found.")
    return serialize_candidate(candidate)


@router.put("/candidates/{candidate_id}", response_model=CandidateOut)
def update_candidate(
    candidate_id: int, payload: CandidateUpdate, db: DbSession, user: CurrentUser
) -> CandidateOut:
    candidate = db.get(Candidate, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate was not found.")
    if not db.get(Job, payload.job_id):
        raise HTTPException(status_code=404, detail="Job was not found.")
    for key, value in payload.model_dump().items():
        setattr(candidate, key, value)
    log_activity(
        db,
        "Candidate",
        candidate.id,
        "UPDATE",
        f"Updated candidate {candidate.full_name}",
    )
    db.commit()
    return get_candidate(candidate_id, db, user)


@router.delete("/candidates/{candidate_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_candidate(candidate_id: int, db: DbSession, user: CurrentUser) -> None:
    candidate = db.get(Candidate, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate was not found.")
    log_activity(
        db,
        "Candidate",
        candidate.id,
        "DELETE",
        f"Deleted candidate {candidate.full_name}",
    )
    db.delete(candidate)
    db.commit()


@router.post(
    "/candidates/{candidate_id}/convert",
    response_model=EmployeeOut,
    status_code=status.HTTP_201_CREATED,
)
def convert_candidate(
    candidate_id: int, payload: ConvertToEmployeePayload, db: DbSession, user: CurrentUser
) -> EmployeeOut:
    candidate = db.get(Candidate, candidate_id)
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate was not found.")
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
                created_by_user_id=user.id,
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
        raise HTTPException(status_code=409, detail="Email is already in use by an employee.") from exc
    statement = (
        select(Employee)
        .where(Employee.id == employee.id)
        .options(
            selectinload(Employee.designation),
            selectinload(Employee.salary_revisions),
        )
    )
    return serialize_employee(db.scalar(statement))


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
    project = db.scalar(
        select(Project)
        .where(Project.id == project_id)
        .options(selectinload(Project.assignments).selectinload(ProjectAssignment.employee))
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project was not found.")
    return serialize_project(project)


@router.put("/projects/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: int, payload: ProjectUpdate, db: DbSession, user: AdminUser
) -> ProjectOut:
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project was not found.")
    for key, value in payload.model_dump().items():
        setattr(project, key, value)
    log_activity(
        db,
        "Project",
        project.id,
        "UPDATE",
        f"Updated project {project.name}",
    )
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409, detail="A project with this name already exists."
        ) from exc
    return get_project(project_id, db, user)


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: int, db: DbSession, user: AdminUser) -> None:
    project = db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project was not found.")
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
    db.add(ProjectAssignment(project_id=project_id, employee_id=payload.employee_id))
    log_activity(
        db,
        "Project",
        project_id,
        "UPDATE",
        f"Assigned {employee.full_name} to {project.name}",
    )
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Employee is already assigned.") from exc
    project = db.scalar(
        select(Project)
        .where(Project.id == project_id)
        .options(selectinload(Project.assignments).selectinload(ProjectAssignment.employee))
    )
    return serialize_project(project)


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
    employee_name = assignment.employee.full_name
    project_name = assignment.project.name
    db.delete(assignment)
    log_activity(
        db,
        "Project",
        project_id,
        "UPDATE",
        f"Removed {employee_name} from {project_name}",
    )
    db.commit()
    project = db.scalar(
        select(Project)
        .where(Project.id == project_id)
        .options(selectinload(Project.assignments).selectinload(ProjectAssignment.employee))
    )
    return serialize_project(project)


@router.get("/payroll", response_model=list[PayrollEntryOut])
def list_payroll(db: DbSession, _: CurrentUser, month: str | None = None) -> list[PayrollEntryOut]:
    statement = (
        select(PayrollEntry)
        .options(selectinload(PayrollEntry.employee))
        .order_by(PayrollEntry.month.desc(), PayrollEntry.id)
    )
    if month:
        statement = statement.where(PayrollEntry.month == month)
    return [serialize_payroll_entry(row) for row in db.scalars(statement).all()]


@router.post("/payroll", response_model=PayrollEntryOut, status_code=status.HTTP_201_CREATED)
def create_payroll_entry(
    payload: PayrollEntryCreate, db: DbSession, user: CurrentUser
) -> PayrollEntryOut:
    payroll_period_end(payload.month)
    employee = db.get(Employee, payload.employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee was not found.")
    entry = PayrollEntry(
        employee_id=payload.employee_id,
        month=payload.month,
        base_compensation=payload.base_compensation,
        adjustment=payload.adjustment,
        final_amount=payload.base_compensation + payload.adjustment,
        currency=payload.currency,
        notes=payload.notes,
    )
    db.add(entry)
    try:
        db.flush()
        log_activity(
            db,
            "PayrollEntry",
            entry.id,
            "CREATE",
            f"Created {entry.month} payroll for {employee.full_name}",
        )
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409, detail="A payroll entry already exists for this employee and month."
        ) from exc
    entry = db.scalar(
        select(PayrollEntry).where(PayrollEntry.id == entry.id).options(selectinload(PayrollEntry.employee))
    )
    return serialize_payroll_entry(entry)


@router.post("/payroll/generate", response_model=list[PayrollEntryOut])
def generate_payroll(month: str, db: DbSession, user: CurrentUser) -> list[PayrollEntryOut]:
    period_date = payroll_period_end(month)
    existing_employee_ids = set(
        db.scalars(select(PayrollEntry.employee_id).where(PayrollEntry.month == month)).all()
    )
    employees = db.scalars(
        select(Employee)
        .where(
            Employee.status == EmployeeStatus.ACTIVE,
            Employee.joining_date <= period_date,
        )
        .options(selectinload(Employee.salary_revisions))
    ).all()
    created_entries: list[PayrollEntry] = []
    for employee in employees:
        if employee.id in existing_employee_ids:
            continue
        salary = employee_current_salary(employee, period_date)
        if not salary:
            continue
        entry = PayrollEntry(
            employee_id=employee.id,
            month=month,
            base_compensation=salary.base_amount,
            adjustment=0,
            final_amount=salary.base_amount,
            currency=salary.currency,
        )
        db.add(entry)
        created_entries.append(entry)
    db.flush()
    employee_names = {employee.id: employee.full_name for employee in employees}
    for entry in created_entries:
        log_activity(
            db,
            "PayrollEntry",
            entry.id,
            "CREATE",
            f"Generated {entry.month} payroll for {employee_names[entry.employee_id]}",
        )
    db.commit()
    statement = (
        select(PayrollEntry)
        .where(PayrollEntry.month == month)
        .options(selectinload(PayrollEntry.employee))
        .order_by(PayrollEntry.id)
    )
    return [serialize_payroll_entry(row) for row in db.scalars(statement).all()]


@router.put("/payroll/{entry_id}", response_model=PayrollEntryOut)
def update_payroll_entry(
    entry_id: int, payload: PayrollEntryUpdate, db: DbSession, user: CurrentUser
) -> PayrollEntryOut:
    entry = db.scalar(
        select(PayrollEntry).where(PayrollEntry.id == entry_id).options(selectinload(PayrollEntry.employee))
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Payroll entry was not found.")
    entry.base_compensation = payload.base_compensation
    entry.adjustment = payload.adjustment
    entry.final_amount = payload.base_compensation + payload.adjustment
    entry.currency = payload.currency
    entry.notes = payload.notes
    log_activity(
        db,
        "PayrollEntry",
        entry.id,
        "UPDATE",
        f"Updated {entry.month} payroll for {entry.employee.full_name}",
    )
    db.commit()
    return serialize_payroll_entry(entry)


@router.delete("/payroll/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_payroll_entry(entry_id: int, db: DbSession, user: CurrentUser) -> None:
    entry = db.get(PayrollEntry, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Payroll entry was not found.")
    log_activity(
        db,
        "PayrollEntry",
        entry.id,
        "DELETE",
        f"Deleted {entry.month} payroll for {entry.employee.full_name}",
    )
    db.delete(entry)
    db.commit()


@router.patch("/payroll/{entry_id}/pay", response_model=PayrollEntryOut)
def mark_payroll_paid(
    entry_id: int, payload: PayrollMarkPaid, db: DbSession, user: CurrentUser
) -> PayrollEntryOut:
    entry = db.scalar(
        select(PayrollEntry).where(PayrollEntry.id == entry_id).options(selectinload(PayrollEntry.employee))
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Payroll entry was not found.")
    entry.status = PayrollEntryStatus.PAID
    entry.payment_date = payload.payment_date or date.today()
    log_activity(
        db,
        "PayrollEntry",
        entry.id,
        "PAID",
        f"Marked {entry.month} payroll paid for {entry.employee.full_name}",
    )
    db.commit()
    return serialize_payroll_entry(entry)


@router.get("/home", response_model=HomeOut)
def get_home(db: DbSession, _: CurrentUser) -> HomeOut:
    today = date.today()
    attention_cutoff = today + timedelta(days=7)

    candidates = db.scalars(
        select(Candidate)
        .where(
            Candidate.interview_date >= today,
            Candidate.stage.not_in([CandidateStage.HIRED, CandidateStage.REJECTED]),
        )
        .options(selectinload(Candidate.job))
        .order_by(Candidate.interview_date)
        .limit(20)
    ).all()
    employees = db.scalars(
        select(Employee)
        .where(
            Employee.joining_date >= today,
            Employee.status == EmployeeStatus.ACTIVE,
        )
        .options(selectinload(Employee.designation))
        .order_by(Employee.joining_date)
        .limit(20)
    ).all()
    projects = db.scalars(
        select(Project)
        .where(
            Project.end_date >= today,
            Project.status != ProjectStatus.COMPLETED,
        )
        .order_by(Project.end_date)
        .limit(20)
    ).all()

    upcoming = [
        *[
            HomeItem(
                kind="INTERVIEW",
                title=f"Interview with {candidate.full_name}",
                description=candidate.job.title,
                event_date=candidate.interview_date,
                href="/hiring",
            )
            for candidate in candidates
        ],
        *[
            HomeItem(
                kind="JOINING",
                title=f"{employee.full_name} is joining",
                description=employee.designation.name
                if employee.designation
                else "New employee",
                event_date=employee.joining_date,
                href=f"/employees/{employee.id}",
            )
            for employee in employees
        ],
        *[
            HomeItem(
                kind="PROJECT_DEADLINE",
                title=f"{project.name} deadline",
                description=project.client_name,
                event_date=project.end_date,
                href=f"/projects/{project.id}",
            )
            for project in projects
        ],
    ]
    upcoming.sort(key=lambda item: item.event_date or date.max)
    upcoming = upcoming[:12]

    needs_attention = [
        item
        for item in upcoming
        if item.event_date is not None and item.event_date <= attention_cutoff
    ]
    pending_payroll = db.scalar(
        select(func.count())
        .select_from(PayrollEntry)
        .where(PayrollEntry.status == PayrollEntryStatus.PENDING)
    )
    if pending_payroll:
        needs_attention.append(
            HomeItem(
                kind="PAYROLL",
                title=f"{pending_payroll} payroll "
                f"{'entry' if pending_payroll == 1 else 'entries'} pending",
                description="Review outstanding employee payments.",
                href="/payroll",
            )
        )

    activities = list(
        db.scalars(
            select(ActivityLog)
            .where(
                ActivityLog.entity.in_(
                    ["Candidate", "Job", "Employee", "Project", "PayrollEntry"]
                )
            )
            .order_by(ActivityLog.timestamp.desc())
            .limit(12)
        ).all()
    )
    return HomeOut(
        needs_attention=needs_attention,
        upcoming=upcoming,
        recent_activity=[ActivityOut.model_validate(row) for row in activities],
    )


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
