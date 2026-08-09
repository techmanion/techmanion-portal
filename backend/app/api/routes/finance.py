from fastapi import APIRouter, HTTPException, status

from app.api.dependencies import CurrentUser, DbSession
from app.core.errors import get_or_404
from app.models import BankAccount, BankTransaction, Employee, Expense, PayrollEntry
from app.repositories.finance import (
    get_bank_account_detailed,
    list_bank_accounts,
    list_expenses,
    list_payroll_entries_detailed,
    list_project_payment_rows,
)
from app.repositories.payroll import get_payroll_entry_detailed
from app.schemas import (
    BankAccountCreate,
    BankAccountOut,
    BankAccountUpdate,
    BankTransactionCreate,
    BankTransactionOut,
    BankTransferCreate,
    BankTransferOut,
    ExpenseCreate,
    ExpenseOut,
    ExpenseUpdate,
    FinanceOverviewOut,
    IncomeOut,
    PayrollEntryCreate,
    PayrollEntryOut,
    PayrollEntryUpdate,
    PayrollMarkPaid,
)
from app.services import (
    add_bank_credit as add_bank_credit_service,
    add_bank_debit as add_bank_debit_service,
    bank_account_balance,
    build_finance_overview,
    create_bank_account as create_bank_account_service,
    create_bank_transfer as create_bank_transfer_service,
    create_expense as create_expense_service,
    create_payroll_entry as create_payroll_entry_service,
    delete_expense as delete_expense_service,
    delete_payroll_entry as delete_payroll_entry_service,
    generate_payroll_for_month,
    mark_payroll_paid as mark_payroll_paid_service,
    update_bank_account as update_bank_account_service,
    update_expense as update_expense_service,
    update_payroll_entry as update_payroll_entry_service,
)

router = APIRouter(prefix="/finance", tags=["finance"])


def serialize_bank_transaction(transaction: BankTransaction) -> BankTransactionOut:
    return BankTransactionOut(
        id=transaction.id,
        bank_account_id=transaction.bank_account_id,
        transaction_type=transaction.transaction_type,
        is_transfer=transaction.is_transfer,
        date=transaction.transaction_date,
        amount=transaction.amount,
        pkr_equivalent=transaction.pkr_equivalent,
        description=transaction.description,
        notes=transaction.notes,
        transfer_id=transaction.transfer_id,
        counterparty_account_id=transaction.counterparty_account_id,
        counterparty_account_name=(
            transaction.counterparty_account.name if transaction.counterparty_account else None
        ),
        source=transaction.source,
        is_reconciled=transaction.is_reconciled,
    )


def serialize_bank_account(account: BankAccount) -> BankAccountOut:
    return BankAccountOut(
        id=account.id,
        name=account.name,
        bank_name=account.bank_name,
        currency=account.currency,
        opening_balance=account.opening_balance,
        opening_balance_pkr=account.opening_balance_pkr,
        is_active=account.is_active,
        account_identifier=account.account_identifier,
        notes=account.notes,
        balance=bank_account_balance(account),
        transactions=[serialize_bank_transaction(row) for row in account.transactions],
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
        bank_account_id=entry.bank_transaction.bank_account_id if entry.bank_transaction else None,
        bank_transaction_id=entry.bank_transaction_id,
        pkr_equivalent=entry.bank_transaction.pkr_equivalent if entry.bank_transaction else None,
    )


def serialize_expense(expense: Expense) -> ExpenseOut:
    return ExpenseOut(
        id=expense.id,
        title=expense.title,
        category=expense.category,
        amount=expense.amount,
        currency=expense.currency,
        expense_type=expense.expense_type,
        frequency=expense.frequency,
        date=expense.expense_date,
        notes=expense.notes,
        bank_account_id=expense.bank_transaction.bank_account_id if expense.bank_transaction else None,
        bank_transaction_id=expense.bank_transaction_id,
    )


@router.get("/overview", response_model=FinanceOverviewOut)
def get_finance_overview(db: DbSession, _: CurrentUser) -> FinanceOverviewOut:
    return build_finance_overview(db)


@router.get("/income", response_model=list[IncomeOut])
def list_income(db: DbSession, _: CurrentUser) -> list[IncomeOut]:
    return [
        IncomeOut(
            id=payment.id,
            date=payment.payment_date,
            project_id=project.id,
            project_name=project.name,
            client_name=project.client_name,
            amount=payment.amount,
            currency=project.currency.value,
            payment_method=payment.method,
            reference=payment.reference,
            notes=payment.notes,
        )
        for payment, project in list_project_payment_rows(db)
    ]


@router.get("/expenses", response_model=list[ExpenseOut])
def get_expenses(db: DbSession, _: CurrentUser) -> list[ExpenseOut]:
    return [serialize_expense(expense) for expense in list_expenses(db)]


@router.post("/expenses", response_model=ExpenseOut, status_code=status.HTTP_201_CREATED)
def create_expense(payload: ExpenseCreate, db: DbSession, user: CurrentUser) -> ExpenseOut:
    account = get_or_404(db, BankAccount, payload.bank_account_id, "Bank account was not found.")
    return serialize_expense(create_expense_service(db, payload, account, user))


@router.put("/expenses/{expense_id}", response_model=ExpenseOut)
def update_expense(
    expense_id: int, payload: ExpenseUpdate, db: DbSession, user: CurrentUser
) -> ExpenseOut:
    expense = get_or_404(db, Expense, expense_id, "Expense was not found.")
    account = get_or_404(db, BankAccount, payload.bank_account_id, "Bank account was not found.")
    return serialize_expense(update_expense_service(db, expense, payload, account, user))


@router.delete("/expenses/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(expense_id: int, db: DbSession, user: CurrentUser) -> None:
    expense = get_or_404(db, Expense, expense_id, "Expense was not found.")
    delete_expense_service(db, expense, user)


@router.get("/payroll", response_model=list[PayrollEntryOut])
def list_payroll(
    db: DbSession, _: CurrentUser, month: str | None = None
) -> list[PayrollEntryOut]:
    return [serialize_payroll_entry(row) for row in list_payroll_entries_detailed(db, month)]


@router.post("/payroll", response_model=PayrollEntryOut, status_code=status.HTTP_201_CREATED)
def create_payroll_entry(
    payload: PayrollEntryCreate, db: DbSession, user: CurrentUser
) -> PayrollEntryOut:
    employee = get_or_404(db, Employee, payload.employee_id, "Employee was not found.")
    entry = create_payroll_entry_service(db, payload, employee, user)
    return serialize_payroll_entry(get_payroll_entry_detailed(db, entry.id))


@router.post("/payroll/generate", response_model=list[PayrollEntryOut])
def generate_payroll(month: str, db: DbSession, user: CurrentUser) -> list[PayrollEntryOut]:
    generate_payroll_for_month(db, month, user)
    return [serialize_payroll_entry(row) for row in list_payroll_entries_detailed(db, month)]


@router.put("/payroll/{entry_id}", response_model=PayrollEntryOut)
def update_payroll_entry(
    entry_id: int, payload: PayrollEntryUpdate, db: DbSession, user: CurrentUser
) -> PayrollEntryOut:
    entry = get_payroll_entry_detailed(db, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Payroll entry was not found.")
    return serialize_payroll_entry(update_payroll_entry_service(db, entry, payload, user))


@router.delete("/payroll/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_payroll_entry(entry_id: int, db: DbSession, user: CurrentUser) -> None:
    entry = get_or_404(db, PayrollEntry, entry_id, "Payroll entry was not found.")
    delete_payroll_entry_service(db, entry, user)


@router.patch("/payroll/{entry_id}/pay", response_model=PayrollEntryOut)
def mark_payroll_paid(
    entry_id: int, payload: PayrollMarkPaid, db: DbSession, user: CurrentUser
) -> PayrollEntryOut:
    entry = get_payroll_entry_detailed(db, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Payroll entry was not found.")
    account = get_or_404(db, BankAccount, payload.bank_account_id, "Bank account was not found.")
    return serialize_payroll_entry(mark_payroll_paid_service(db, entry, payload, account, user))


@router.get("/bank-accounts", response_model=list[BankAccountOut])
def list_bank_accounts_route(db: DbSession, _: CurrentUser) -> list[BankAccountOut]:
    return [serialize_bank_account(row) for row in list_bank_accounts(db)]


@router.post(
    "/bank-accounts", response_model=BankAccountOut, status_code=status.HTTP_201_CREATED
)
def create_bank_account(
    payload: BankAccountCreate, db: DbSession, user: CurrentUser
) -> BankAccountOut:
    account = create_bank_account_service(db, payload, user)
    return serialize_bank_account(get_bank_account_detailed(db, account.id))


@router.get("/bank-accounts/{account_id}", response_model=BankAccountOut)
def get_bank_account(account_id: int, db: DbSession, _: CurrentUser) -> BankAccountOut:
    account = get_bank_account_detailed(db, account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Bank account was not found.")
    return serialize_bank_account(account)


@router.put("/bank-accounts/{account_id}", response_model=BankAccountOut)
def update_bank_account(
    account_id: int, payload: BankAccountUpdate, db: DbSession, user: CurrentUser
) -> BankAccountOut:
    account = get_or_404(db, BankAccount, account_id, "Bank account was not found.")
    update_bank_account_service(db, account, payload, user)
    return serialize_bank_account(get_bank_account_detailed(db, account_id))


@router.post(
    "/bank-accounts/{account_id}/credit",
    response_model=BankAccountOut,
    status_code=status.HTTP_201_CREATED,
)
def add_bank_credit(
    account_id: int, payload: BankTransactionCreate, db: DbSession, user: CurrentUser
) -> BankAccountOut:
    account = get_or_404(db, BankAccount, account_id, "Bank account was not found.")
    add_bank_credit_service(db, account, payload, user)
    return serialize_bank_account(get_bank_account_detailed(db, account_id))


@router.post(
    "/bank-accounts/{account_id}/debit",
    response_model=BankAccountOut,
    status_code=status.HTTP_201_CREATED,
)
def add_bank_debit(
    account_id: int, payload: BankTransactionCreate, db: DbSession, user: CurrentUser
) -> BankAccountOut:
    account = get_or_404(db, BankAccount, account_id, "Bank account was not found.")
    add_bank_debit_service(db, account, payload, user)
    return serialize_bank_account(get_bank_account_detailed(db, account_id))


@router.post(
    "/bank-transfers", response_model=BankTransferOut, status_code=status.HTTP_201_CREATED
)
def create_bank_transfer(
    payload: BankTransferCreate, db: DbSession, user: CurrentUser
) -> BankTransferOut:
    source = get_or_404(
        db, BankAccount, payload.source_account_id, "Source account was not found."
    )
    destination = get_or_404(
        db, BankAccount, payload.destination_account_id, "Destination account was not found."
    )
    create_bank_transfer_service(db, source, destination, payload, user)
    return BankTransferOut(
        source_account=serialize_bank_account(get_bank_account_detailed(db, source.id)),
        destination_account=serialize_bank_account(
            get_bank_account_detailed(db, destination.id)
        ),
    )
