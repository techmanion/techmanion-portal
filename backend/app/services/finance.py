from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import (
    BankAccount,
    Expense,
    PayrollEntry,
    PayrollEntryStatus,
    TransactionSource,
    TransactionType,
    User,
)
from app.repositories.finance import (
    list_bank_accounts,
    list_expenses,
    list_payroll_entries_detailed,
    list_project_payment_rows,
)
from app.schemas import ExpenseCreate, ExpenseUpdate, FinanceOverviewOut, FinanceTransactionOut
from app.services.activity import log_activity
from app.services.bank import (
    _build_bank_transaction,
    _require_active_bank_account,
    _resolve_pkr_equivalent,
    bank_account_balance_pkr,
    bank_account_opening_balance_pkr,
)
from app.services.payroll import payroll_period_end


def _expense_values(payload: ExpenseCreate | ExpenseUpdate) -> dict:
    values = payload.model_dump()
    values["expense_date"] = values.pop("date")
    values.pop("bank_account_id")
    values.pop("pkr_equivalent")
    return values


def _require_expense_currency_match(payload: ExpenseCreate | ExpenseUpdate, account: BankAccount) -> None:
    if payload.currency != account.currency.value:
        raise HTTPException(
            status_code=422,
            detail="Expense currency must match the selected bank account currency.",
        )


def create_expense(
    db: Session, payload: ExpenseCreate, account: BankAccount, actor: User | None = None
) -> Expense:
    _require_expense_currency_match(payload, account)
    expense = Expense(**_expense_values(payload))
    db.add(expense)
    db.flush()
    transaction = _build_bank_transaction(
        db,
        account,
        TransactionType.DEBIT,
        transaction_date=payload.date,
        amount=payload.amount,
        pkr_equivalent_supplied=payload.pkr_equivalent,
        description=f"Expense · {payload.title}",
        notes=payload.notes,
        source=TransactionSource.EXPENSE,
    )
    expense.bank_transaction_id = transaction.id
    db.flush()
    log_activity(
        db,
        "Expense",
        expense.id,
        "CREATE",
        f"Created expense {expense.title}",
        performed_by_user_id=actor.id if actor else None,
        metadata={"amount": expense.amount, "currency": expense.currency},
    )
    db.commit()
    return expense


def update_expense(
    db: Session,
    expense: Expense,
    payload: ExpenseUpdate,
    account: BankAccount,
    actor: User | None = None,
) -> Expense:
    _require_expense_currency_match(payload, account)
    for key, value in _expense_values(payload).items():
        setattr(expense, key, value)

    transaction = expense.bank_transaction
    if transaction is None:
        transaction = _build_bank_transaction(
            db,
            account,
            TransactionType.DEBIT,
            transaction_date=payload.date,
            amount=payload.amount,
            pkr_equivalent_supplied=payload.pkr_equivalent,
            description=f"Expense · {payload.title}",
            notes=payload.notes,
            source=TransactionSource.EXPENSE,
        )
        expense.bank_transaction_id = transaction.id
    else:
        _require_active_bank_account(account)
        transaction.bank_account_id = account.id
        transaction.transaction_date = payload.date
        transaction.amount = payload.amount
        transaction.pkr_equivalent = _resolve_pkr_equivalent(account, payload.amount, payload.pkr_equivalent)
        transaction.description = f"Expense · {payload.title}"
        transaction.notes = payload.notes

    log_activity(
        db,
        "Expense",
        expense.id,
        "UPDATE",
        f"Updated expense {expense.title}",
        performed_by_user_id=actor.id if actor else None,
    )
    db.commit()
    return expense


def delete_expense(db: Session, expense: Expense, actor: User | None = None) -> None:
    transaction = expense.bank_transaction
    log_activity(
        db,
        "Expense",
        expense.id,
        "DELETE",
        f"Deleted expense {expense.title}",
        performed_by_user_id=actor.id if actor else None,
    )
    db.delete(expense)
    db.flush()
    if transaction is not None:
        db.delete(transaction)
    db.commit()


def build_finance_overview(db: Session) -> FinanceOverviewOut:
    income_rows = list_project_payment_rows(db)
    expenses = list_expenses(db)
    payroll_entries = list_payroll_entries_detailed(db)
    bank_accounts = list_bank_accounts(db)

    total_income = sum(
        payment.bank_transaction.pkr_equivalent
        for payment, _ in income_rows
        if payment.bank_transaction is not None
    )
    expense_total = sum(
        expense.bank_transaction.pkr_equivalent
        for expense in expenses
        if expense.bank_transaction is not None
    )
    paid_payroll_entries = [
        entry
        for entry in payroll_entries
        if entry.status == PayrollEntryStatus.PAID and entry.bank_transaction is not None
    ]
    payroll_total = sum(entry.bank_transaction.pkr_equivalent for entry in paid_payroll_entries)
    total_expenses = expense_total + payroll_total

    bank_balance = sum(bank_account_balance_pkr(account) for account in bank_accounts)
    opening_capital = sum(bank_account_opening_balance_pkr(account) for account in bank_accounts)
    net_position = total_income - total_expenses
    # Opening balances are capital contributed to the business, not income, so they're
    # excluded from the bank activity reconciled against tracked income/expenses.
    net_bank_activity = bank_balance - opening_capital
    unreconciled_amount = total_income - total_expenses - net_bank_activity

    transactions = [
        FinanceTransactionOut(
            id=f"income-{payment.id}",
            kind="INCOME",
            date=payment.payment_date,
            title=project.name,
            description=f"{project.client_name} · {payment.method}",
            amount=payment.amount,
            currency=project.currency.value,
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
        bank_balance=bank_balance,
        net_position=net_position,
        unreconciled_amount=unreconciled_amount,
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
