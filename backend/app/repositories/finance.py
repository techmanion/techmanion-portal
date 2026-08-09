from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models import BankAccount, BankTransaction, Expense, PayrollEntry, Project, ProjectPayment


def _bank_account_options():
    return (selectinload(BankAccount.transactions).selectinload(BankTransaction.counterparty_account),)


def list_bank_accounts(db: Session) -> list[BankAccount]:
    statement = select(BankAccount).options(*_bank_account_options()).order_by(BankAccount.name)
    return list(db.scalars(statement).all())


def get_bank_account_detailed(db: Session, account_id: int) -> BankAccount | None:
    statement = (
        select(BankAccount)
        .where(BankAccount.id == account_id)
        .options(*_bank_account_options())
    )
    return db.scalar(statement)


def list_project_payment_rows(db: Session) -> list[tuple[ProjectPayment, Project]]:
    statement = (
        select(ProjectPayment, Project)
        .join(Project, Project.id == ProjectPayment.project_id)
        .options(selectinload(ProjectPayment.bank_transaction))
        .order_by(ProjectPayment.payment_date.desc(), ProjectPayment.id.desc())
    )
    return [(payment, project) for payment, project in db.execute(statement).all()]


def list_expenses(db: Session) -> list[Expense]:
    statement = (
        select(Expense)
        .options(selectinload(Expense.bank_transaction))
        .order_by(Expense.expense_date.desc(), Expense.id.desc())
    )
    return list(db.scalars(statement).all())


def list_payroll_entries_detailed(db: Session, month: str | None = None) -> list[PayrollEntry]:
    statement = (
        select(PayrollEntry)
        .options(
            selectinload(PayrollEntry.employee),
            selectinload(PayrollEntry.bank_transaction),
        )
        .order_by(PayrollEntry.month.desc(), PayrollEntry.id)
    )
    if month:
        statement = statement.where(PayrollEntry.month == month)
    return list(db.scalars(statement).all())
