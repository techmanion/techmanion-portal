from calendar import monthrange
from datetime import date
from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import (
    MilestoneStatus,
    PaymentStatus,
    Project,
    ProjectMilestone,
    ProjectPayment,
    ProjectType,
)
from app.schemas.projects import ProjectCreate, ProjectPaymentCreate, ProjectUpdate
from app.services.activity import log_activity


def _replace_milestones(project: Project, rows: list[dict]) -> None:
    project.milestones = [ProjectMilestone(**row) for row in rows]


def _project_values(payload: ProjectCreate | ProjectUpdate) -> tuple[dict, list[dict]]:
    values = payload.model_dump()
    milestones = values.pop("milestones")
    for key in ("estimated_hours", "logged_hours"):
        if values[key] is not None:
            values[key] = Decimal(str(values[key]))
    return values, milestones


def create_project(db: Session, payload: ProjectCreate) -> Project:
    values, milestones = _project_values(payload)
    project = Project(**values)
    _replace_milestones(project, milestones)
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
    return project


def update_project(db: Session, project: Project, payload: ProjectUpdate) -> Project:
    values, milestones = _project_values(payload)
    for key, value in values.items():
        setattr(project, key, value)
    _replace_milestones(project, milestones)
    log_activity(db, "Project", project.id, "UPDATE", f"Updated project {project.name}")
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409, detail="A project with this name already exists."
        ) from exc
    return project


def delete_project(db: Session, project: Project) -> None:
    log_activity(db, "Project", project.id, "DELETE", f"Deleted project {project.name}")
    db.delete(project)
    db.commit()


def add_project_payment(
    db: Session, project: Project, payload: ProjectPaymentCreate
) -> ProjectPayment:
    payment = ProjectPayment(project_id=project.id, **payload.model_dump())
    db.add(payment)
    log_activity(
        db,
        "Project",
        project.id,
        "UPDATE",
        f"Recorded payment for {project.name}",
    )
    db.commit()
    return payment


def delete_project_payment(db: Session, project: Project, payment: ProjectPayment) -> None:
    db.delete(payment)
    log_activity(
        db,
        "Project",
        project.id,
        "UPDATE",
        f"Removed payment from {project.name}",
    )
    db.commit()


def _recurring_billing_dates(project: Project, cutoff: date) -> list[date]:
    if not project.billing_day or cutoff < project.start_date:
        return []
    year, month = project.start_date.year, project.start_date.month
    dates: list[date] = []
    while (year, month) <= (cutoff.year, cutoff.month):
        billing_date = date(year, month, min(project.billing_day, monthrange(year, month)[1]))
        if project.start_date <= billing_date <= cutoff:
            dates.append(billing_date)
        if month == 12:
            year, month = year + 1, 1
        else:
            month += 1
    return dates


def project_billable_amount(project: Project, today: date | None = None) -> int:
    current_date = today or date.today()
    if project.project_type == ProjectType.FIXED:
        return project.contract_value or 0
    if project.project_type == ProjectType.HOURLY:
        amount = Decimal(project.hourly_rate or 0) * (project.logged_hours or Decimal(0))
        return int(amount.quantize(Decimal("1"), rounding=ROUND_HALF_UP))
    cutoff = min(current_date, project.end_date) if project.end_date else current_date
    return (project.monthly_amount or 0) * len(_recurring_billing_dates(project, cutoff))


def project_payment_summary(
    project: Project, today: date | None = None
) -> tuple[int, int, PaymentStatus]:
    current_date = today or date.today()
    total_received = sum(payment.amount for payment in project.payments)
    billable_amount = project_billable_amount(project, current_date)
    outstanding = max(billable_amount - total_received, 0)

    if billable_amount > 0 and outstanding == 0:
        payment_status = PaymentStatus.FULLY_PAID
    elif outstanding and _is_overdue(project, current_date):
        payment_status = PaymentStatus.OVERDUE
    elif total_received > 0:
        payment_status = PaymentStatus.PARTIALLY_PAID
    elif project.status.value == "PLANNED":
        payment_status = PaymentStatus.NOT_STARTED
    else:
        payment_status = PaymentStatus.IN_PROGRESS
    return total_received, outstanding, payment_status


def _is_overdue(project: Project, today: date) -> bool:
    if project.end_date and project.end_date < today:
        return True
    if project.project_type == ProjectType.FIXED:
        return any(
            milestone.due_date < today and milestone.status != MilestoneStatus.COMPLETED
            for milestone in project.milestones
        )
    if project.project_type == ProjectType.MONTHLY_RECURRING:
        return any(due_date < today for due_date in _recurring_billing_dates(project, today))
    return False
