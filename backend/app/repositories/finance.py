from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import Expense, PayrollEntry, Project, ProjectPayment


def list_project_payment_rows(db: Session) -> list[tuple[ProjectPayment, Project]]:
    statement = (
        select(ProjectPayment, Project)
        .join(Project, Project.id == ProjectPayment.project_id)
        .order_by(ProjectPayment.payment_date.desc(), ProjectPayment.id.desc())
    )
    return [(payment, project) for payment, project in db.execute(statement).all()]


def list_expenses(db: Session) -> list[Expense]:
    statement = select(Expense).order_by(Expense.expense_date.desc(), Expense.id.desc())
    return list(db.scalars(statement).all())


def list_payroll_entries_detailed(db: Session, month: str | None = None) -> list[PayrollEntry]:
    statement = (
        select(PayrollEntry)
        .options(selectinload(PayrollEntry.employee))
        .order_by(PayrollEntry.month.desc(), PayrollEntry.id)
    )
    if month:
        statement = statement.where(PayrollEntry.month == month)
    return list(db.scalars(statement).all())
