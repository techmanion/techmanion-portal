from sqlalchemy.orm import Session

from app.models import Expense, PayrollEntry
from app.repositories.finance import (
    list_expenses,
    list_payroll_entries_detailed,
    list_project_payment_rows,
)
from app.schemas import (
    ExpenseCreate,
    ExpenseUpdate,
    FinanceOverviewOut,
    FinanceTransactionOut,
)
from app.services.activity import log_activity
from app.services.payroll import payroll_period_end


def _expense_values(payload: ExpenseCreate | ExpenseUpdate) -> dict:
    values = payload.model_dump()
    values["expense_date"] = values.pop("date")
    return values


def create_expense(db: Session, payload: ExpenseCreate) -> Expense:
    expense = Expense(**_expense_values(payload))
    db.add(expense)
    db.flush()
    log_activity(db, "Expense", expense.id, "CREATE", f"Created expense {expense.title}")
    db.commit()
    return expense


def update_expense(db: Session, expense: Expense, payload: ExpenseUpdate) -> Expense:
    for key, value in _expense_values(payload).items():
        setattr(expense, key, value)
    log_activity(db, "Expense", expense.id, "UPDATE", f"Updated expense {expense.title}")
    db.commit()
    return expense


def delete_expense(db: Session, expense: Expense) -> None:
    log_activity(db, "Expense", expense.id, "DELETE", f"Deleted expense {expense.title}")
    db.delete(expense)
    db.commit()


def build_finance_overview(db: Session) -> FinanceOverviewOut:
    income_rows = list_project_payment_rows(db)
    expenses = list_expenses(db)
    payroll_entries = list_payroll_entries_detailed(db)

    total_income = sum(payment.amount for payment, _ in income_rows)
    payroll_total = sum(entry.final_amount for entry in payroll_entries)
    total_expenses = payroll_total + sum(expense.amount for expense in expenses)

    transactions = [
        FinanceTransactionOut(
            id=f"income-{payment.id}",
            kind="INCOME",
            date=payment.payment_date,
            title=project.name,
            description=f"{project.client_name} · {payment.method}",
            amount=payment.amount,
            currency="PKR",
        )
        for payment, project in income_rows
    ]
    transactions.extend(
        FinanceTransactionOut(
            id=f"expense-{expense.id}",
            kind="EXPENSE",
            date=expense.expense_date,
            title=expense.title,
            description=expense.category,
            amount=expense.amount,
            currency=expense.currency,
        )
        for expense in expenses
    )
    transactions.extend(_payroll_transaction(entry) for entry in payroll_entries)
    transactions.sort(key=lambda row: (row.date, row.id), reverse=True)

    return FinanceOverviewOut(
        total_income=total_income,
        total_expenses=total_expenses,
        payroll_total=payroll_total,
        net_cash_flow=total_income - total_expenses,
        recent_transactions=transactions[:12],
    )


def _payroll_transaction(entry: PayrollEntry) -> FinanceTransactionOut:
    return FinanceTransactionOut(
        id=f"payroll-{entry.id}",
        kind="PAYROLL",
        date=entry.payment_date or payroll_period_end(entry.month),
        title=entry.employee.full_name,
        description=f"Payroll · {entry.month}",
        amount=entry.final_amount,
        currency=entry.currency,
    )
