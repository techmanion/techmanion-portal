from fastapi import APIRouter, HTTPException, status

from app.api.dependencies import CurrentUser, DbSession, ExecutiveUser
from app.core.errors import get_or_404
from app.models import BankAccount, Project, ProjectPayment
from app.repositories.projects import get_project_detailed, list_projects_detailed
from app.schemas import (
    ProjectCreate,
    ProjectMilestoneOut,
    ProjectOut,
    ProjectPaymentCreate,
    ProjectPaymentOut,
    ProjectUpdate,
)
from app.services import (
    add_project_payment,
    create_project as create_project_service,
    delete_project as delete_project_service,
    delete_project_payment,
    project_payment_summary,
    update_project as update_project_service,
)

router = APIRouter(tags=["projects"])


def serialize_project(project: Project) -> ProjectOut:
    total_received, outstanding_balance, payment_status = project_payment_summary(project)
    return ProjectOut(
        **{column.name: getattr(project, column.name) for column in Project.__table__.columns},
        milestones=[
            ProjectMilestoneOut(
                id=row.id,
                name=row.name,
                amount=row.amount,
                due_date=row.due_date,
                status=row.status,
                paid_date=row.paid_date,
            )
            for row in project.milestones
        ],
        payments=[
            ProjectPaymentOut(
                id=row.id,
                amount=row.amount,
                payment_date=row.payment_date,
                method=row.method,
                reference=row.reference,
                notes=row.notes,
                bank_account_id=row.bank_transaction.bank_account_id if row.bank_transaction else None,
                bank_transaction_id=row.bank_transaction_id,
            )
            for row in project.payments
        ],
        total_received=total_received,
        outstanding_balance=outstanding_balance,
        payment_status=payment_status,
    )


@router.get("/projects", response_model=list[ProjectOut])
def list_projects(db: DbSession, _: CurrentUser) -> list[ProjectOut]:
    return [serialize_project(project) for project in list_projects_detailed(db)]


@router.post("/projects", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(payload: ProjectCreate, db: DbSession, user: ExecutiveUser) -> ProjectOut:
    project = create_project_service(db, payload, user)
    return serialize_project(get_project_detailed(db, project.id))


@router.get("/projects/{project_id}", response_model=ProjectOut)
def get_project(project_id: int, db: DbSession, _: CurrentUser) -> ProjectOut:
    project = get_project_detailed(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project was not found.")
    return serialize_project(project)


@router.put("/projects/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: int, payload: ProjectUpdate, db: DbSession, user: ExecutiveUser
) -> ProjectOut:
    project = get_project_detailed(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project was not found.")
    update_project_service(db, project, payload, user)
    return serialize_project(get_project_detailed(db, project_id))


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: int, db: DbSession, user: ExecutiveUser) -> None:
    project = get_or_404(db, Project, project_id, "Project was not found.")
    delete_project_service(db, project, user)


@router.post(
    "/projects/{project_id}/payments",
    response_model=ProjectOut,
    status_code=status.HTTP_201_CREATED,
)
def add_payment(
    project_id: int, payload: ProjectPaymentCreate, db: DbSession, user: ExecutiveUser
) -> ProjectOut:
    project = get_or_404(db, Project, project_id, "Project was not found.")
    account = get_or_404(db, BankAccount, payload.bank_account_id, "Bank account was not found.")
    add_project_payment(db, project, payload, account, user)
    return serialize_project(get_project_detailed(db, project_id))


@router.delete("/projects/{project_id}/payments/{payment_id}", response_model=ProjectOut)
def remove_payment(
    project_id: int, payment_id: int, db: DbSession, user: ExecutiveUser
) -> ProjectOut:
    project = get_or_404(db, Project, project_id, "Project was not found.")
    payment = get_or_404(db, ProjectPayment, payment_id, "Payment was not found.")
    if payment.project_id != project.id:
        raise HTTPException(status_code=404, detail="Payment was not found.")
    delete_project_payment(db, project, payment, user)
    return serialize_project(get_project_detailed(db, project_id))
