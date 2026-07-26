from datetime import date
from pathlib import Path
from typing import Annotated
from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload

from app.config import settings
from app.dependencies import AdminUser, CurrentUser, DbSession
from app.models import (
    AuditLog,
    Department,
    Designation,
    Employee,
    EmployeeDocument,
    EmployeeStatus,
    LineItemType,
    PaymentStatus,
    PayrollRun,
    Payslip,
    PayslipLineItem,
    Project,
    ProjectAssignment,
    SalaryRevision,
    TaxSlab,
    User,
    UserRole,
    utc_now,
)
from app.schemas import (
    AssignmentOut,
    AuditOut,
    DocumentOut,
    EmployeeCreate,
    EmployeeOut,
    EmployeeUpdate,
    NamedOption,
    PasswordChange,
    PaymentUpdate,
    PayrollRunOut,
    PayslipOut,
    ProfileUpdate,
    ProjectAssignmentCreate,
    ProjectCreate,
    ProjectOut,
    SalaryCreate,
    SalaryOut,
    TaxSlabInput,
    TaxSlabOut,
    TokenOut,
    UserAdminUpdate,
    UserCreate,
    UserOut,
)
from app.security import create_access_token, hash_password, verify_password
from app.services import audit, employee_current_salary, monthly_tax

router = APIRouter()


def serialize_employee(employee: Employee) -> EmployeeOut:
    salary = employee_current_salary(employee)
    return EmployeeOut(
        **{column.name: getattr(employee, column.name) for column in Employee.__table__.columns},
        full_name=employee.full_name,
        department=employee.department,
        designation=employee.designation,
        current_salary=salary,
    )


def serialize_project(project: Project) -> ProjectOut:
    assignments = [
        AssignmentOut(
            id=item.id,
            employee_id=item.employee_id,
            employee_name=item.employee.full_name,
            project_role=item.project_role,
            allocation_pct=item.allocation_pct,
            start_date=item.start_date,
            end_date=item.end_date,
        )
        for item in project.assignments
    ]
    return ProjectOut(
        **{column.name: getattr(project, column.name) for column in Project.__table__.columns},
        assignments=assignments,
    )


def serialize_payroll(payroll: PayrollRun) -> PayrollRunOut:
    return PayrollRunOut(
        id=payroll.id,
        period_month=payroll.period_month,
        status=payroll.status,
        payslips=[
            PayslipOut(
                id=item.id,
                employee_id=item.employee_id,
                employee_name=item.employee.full_name,
                base_amount=item.base_amount,
                currency=item.currency,
                gross_amount=item.gross_amount,
                tax_amount=item.tax_amount,
                net_amount=item.net_amount,
                payment_status=item.payment_status,
                paid_amount=item.paid_amount,
            )
            for item in payroll.payslips
        ],
    )


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
    before = {"name": user.name}
    user.name = payload.name.strip()
    audit(db, user, "user.profile_updated", "User", user.id, before=before, after={"name": user.name})
    db.commit()
    db.refresh(user)
    return user


@router.post("/auth/change-password", status_code=status.HTTP_204_NO_CONTENT)
def change_password(payload: PasswordChange, db: DbSession, user: CurrentUser) -> None:
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
    user.password_hash = hash_password(payload.new_password)
    audit(db, user, "user.password_changed", "User", user.id)
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
        audit(
            db,
            admin,
            "user.created",
            "User",
            new_user.id,
            after={"email": new_user.email, "role": new_user.role.value},
        )
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
    before = {"role": target.role.value, "isActive": target.is_active}
    if payload.role is not None:
        target.role = payload.role
    if payload.is_active is not None:
        target.is_active = payload.is_active
    audit(
        db,
        admin,
        "user.updated",
        "User",
        target.id,
        before=before,
        after={"role": target.role.value, "isActive": target.is_active},
    )
    db.commit()
    db.refresh(target)
    return target


@router.get("/employees", response_model=list[EmployeeOut])
def list_employees(
    db: DbSession,
    _: CurrentUser,
    search: str = "",
    status_filter: EmployeeStatus | None = None,
    department_id: int | None = None,
    designation_id: int | None = None,
) -> list[EmployeeOut]:
    statement = (
        select(Employee)
        .options(
            selectinload(Employee.department),
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
                Employee.cnic.ilike(term),
            )
        )
    if status_filter:
        statement = statement.where(Employee.status == status_filter)
    if department_id:
        statement = statement.where(Employee.department_id == department_id)
    if designation_id:
        statement = statement.where(Employee.designation_id == designation_id)
    return [serialize_employee(row) for row in db.scalars(statement).all()]


@router.post("/employees", response_model=EmployeeOut, status_code=status.HTTP_201_CREATED)
def create_employee(payload: EmployeeCreate, db: DbSession, user: CurrentUser) -> EmployeeOut:
    data = payload.model_dump(exclude={"base_amount", "currency"})
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
        audit(
            db,
            user,
            "employee.created",
            "Employee",
            employee.id,
            after={"name": employee.full_name, "status": employee.status.value},
        )
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email or CNIC is already in use.") from exc
    statement = (
        select(Employee)
        .where(Employee.id == employee.id)
        .options(
            selectinload(Employee.department),
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
            selectinload(Employee.department),
            selectinload(Employee.designation),
            selectinload(Employee.salary_revisions),
        )
    )
    if not employee:
        raise HTTPException(status_code=404, detail="Employee was not found.")
    return serialize_employee(employee)


@router.put("/employees/{employee_id}", response_model=EmployeeOut)
def update_employee(
    employee_id: int, payload: EmployeeUpdate, db: DbSession, user: CurrentUser
) -> EmployeeOut:
    employee = db.get(Employee, employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee was not found.")
    before = {"status": employee.status.value, "email": employee.email}
    for key, value in payload.model_dump().items():
        setattr(employee, key, value)
    audit(
        db,
        user,
        "employee.updated",
        "Employee",
        employee.id,
        before=before,
        after={"status": employee.status.value, "email": employee.email},
    )
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email or CNIC is already in use.") from exc
    return get_employee(employee_id, db, user)


@router.post("/employees/{employee_id}/salary", response_model=SalaryOut)
def add_salary_revision(
    employee_id: int, payload: SalaryCreate, db: DbSession, user: CurrentUser
) -> SalaryRevision:
    employee = db.get(Employee, employee_id)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee was not found.")
    previous = db.scalar(
        select(SalaryRevision)
        .where(SalaryRevision.employee_id == employee_id)
        .order_by(SalaryRevision.effective_date.desc())
    )
    revision = SalaryRevision(
        employee_id=employee_id,
        created_by_user_id=user.id,
        **payload.model_dump(),
    )
    db.add(revision)
    audit(
        db,
        user,
        "salary.revised",
        "Employee",
        employee_id,
        before={"baseAmount": previous.base_amount} if previous else None,
        after={"baseAmount": revision.base_amount, "currency": revision.currency},
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
        audit(db, user, "project.created", "Project", project.id, after={"name": project.name})
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409, detail="A project with this name already exists."
        ) from exc
    return serialize_project(project)


@router.post("/projects/{project_id}/assignments", response_model=ProjectOut)
def assign_employee(
    project_id: int,
    payload: ProjectAssignmentCreate,
    db: DbSession,
    user: AdminUser,
) -> ProjectOut:
    project = db.get(Project, project_id)
    if not project or not db.get(Employee, payload.employee_id):
        raise HTTPException(status_code=404, detail="Project or employee was not found.")
    db.add(ProjectAssignment(project_id=project_id, **payload.model_dump()))
    audit(
        db,
        user,
        "project.employee_assigned",
        "Project",
        project_id,
        after={"employeeId": payload.employee_id, "allocationPct": payload.allocation_pct},
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


@router.get("/payroll", response_model=list[PayrollRunOut])
def list_payroll(db: DbSession, _: CurrentUser) -> list[PayrollRunOut]:
    runs = db.scalars(
        select(PayrollRun)
        .options(selectinload(PayrollRun.payslips).selectinload(Payslip.employee))
        .order_by(PayrollRun.period_month.desc())
    ).all()
    return [serialize_payroll(run) for run in runs]


@router.post("/payroll/{period_month}", response_model=PayrollRunOut)
def create_payroll(period_month: str, db: DbSession, user: CurrentUser) -> PayrollRunOut:
    if len(period_month) != 7 or period_month[4] != "-":
        raise HTTPException(status_code=422, detail="Month must use YYYY-MM format.")
    existing = db.scalar(select(PayrollRun).where(PayrollRun.period_month == period_month))
    if existing:
        raise HTTPException(status_code=409, detail="Payroll already exists for this month.")
    run = PayrollRun(period_month=period_month, created_by_user_id=user.id)
    db.add(run)
    db.flush()
    employees = db.scalars(
        select(Employee)
        .where(Employee.status.in_([EmployeeStatus.ACTIVE, EmployeeStatus.ON_LEAVE]))
        .options(selectinload(Employee.salary_revisions))
    ).all()
    period_date = date(int(period_month[:4]), int(period_month[5:]), 28)
    for employee in employees:
        salary = employee_current_salary(employee, period_date)
        if not salary:
            continue
        tax = monthly_tax(db, salary.base_amount, period_month)
        payslip = Payslip(
            payroll_run_id=run.id,
            employee_id=employee.id,
            base_amount=salary.base_amount,
            currency=salary.currency,
            gross_amount=salary.base_amount,
            tax_amount=tax,
            net_amount=salary.base_amount - tax,
        )
        payslip.line_items = [
            PayslipLineItem(
                item_type=LineItemType.EARNING,
                category="BASE",
                label="Base salary",
                amount=salary.base_amount,
                currency=salary.currency,
            )
        ]
        if tax:
            payslip.line_items.append(
                PayslipLineItem(
                    item_type=LineItemType.DEDUCTION,
                    category="TAX",
                    label="Income tax",
                    amount=tax,
                    currency=salary.currency,
                )
            )
        db.add(payslip)
    audit(db, user, "payroll.created", "PayrollRun", run.id, after={"period": period_month})
    db.commit()
    run = db.scalar(
        select(PayrollRun)
        .where(PayrollRun.id == run.id)
        .options(selectinload(PayrollRun.payslips).selectinload(Payslip.employee))
    )
    return serialize_payroll(run)


@router.patch("/payslips/{payslip_id}/payment", response_model=PayslipOut)
def update_payment(
    payslip_id: int, payload: PaymentUpdate, db: DbSession, user: CurrentUser
) -> PayslipOut:
    payslip = db.scalar(
        select(Payslip).where(Payslip.id == payslip_id).options(selectinload(Payslip.employee))
    )
    if not payslip:
        raise HTTPException(status_code=404, detail="Payslip was not found.")
    before = {"status": payslip.payment_status.value, "paidAmount": payslip.paid_amount}
    payslip.payment_status = payload.payment_status
    payslip.paid_amount = payload.paid_amount
    payslip.paid_at = utc_now() if payload.payment_status == PaymentStatus.PAID else None
    audit(
        db,
        user,
        "payslip.payment_updated",
        "Payslip",
        payslip.id,
        before=before,
        after={"status": payslip.payment_status.value, "paidAmount": payslip.paid_amount},
    )
    db.commit()
    return PayslipOut(
        id=payslip.id,
        employee_id=payslip.employee_id,
        employee_name=payslip.employee.full_name,
        base_amount=payslip.base_amount,
        currency=payslip.currency,
        gross_amount=payslip.gross_amount,
        tax_amount=payslip.tax_amount,
        net_amount=payslip.net_amount,
        payment_status=payslip.payment_status,
        paid_amount=payslip.paid_amount,
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


@router.get("/settings/tax-slabs", response_model=list[TaxSlabOut])
def list_tax_slabs(db: DbSession, _: CurrentUser) -> list[TaxSlab]:
    return list(
        db.scalars(select(TaxSlab).order_by(TaxSlab.fiscal_year.desc(), TaxSlab.lower_bound)).all()
    )


@router.post("/settings/tax-slabs", response_model=TaxSlabOut)
def add_tax_slab(payload: TaxSlabInput, db: DbSession, _: AdminUser) -> TaxSlab:
    slab = TaxSlab(**payload.model_dump())
    db.add(slab)
    db.commit()
    db.refresh(slab)
    return slab


@router.get("/audit", response_model=list[AuditOut])
def list_audit(db: DbSession, _: AdminUser) -> list[AuditLog]:
    return list(db.scalars(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(200)).all())
