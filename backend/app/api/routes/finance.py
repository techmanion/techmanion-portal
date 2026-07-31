from fastapi import APIRouter, HTTPException, status

from app.api.dependencies import CurrentUser, DbSession
from app.core.errors import get_or_404
from app.models import Employee, Expense, PayrollEntry
from app.repositories.finance import (
    list_expenses,
    list_payroll_entries_detailed,
    list_project_payment_rows,
)
from app.repositories.payroll import get_payroll_entry_detailed
from app.schemas import (
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
    build_finance_overview,
    create_expense as create_expense_service,
    create_payroll_entry as create_payroll_entry_service,
    delete_expense as delete_expense_service,
    delete_payroll_entry as delete_payroll_entry_service,
    generate_payroll_for_month,
    mark_payroll_paid as mark_payroll_paid_service,
    update_expense as update_expense_service,
    update_payroll_entry as update_payroll_entry_service,
)

router = APIRouter(prefix="/finance", tags=["finance"])


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
def create_expense(payload: ExpenseCreate, db: DbSession, _: CurrentUser) -> ExpenseOut:
    return serialize_expense(create_expense_service(db, payload))


@router.put("/expenses/{expense_id}", response_model=ExpenseOut)
def update_expense(
    expense_id: int, payload: ExpenseUpdate, db: DbSession, _: CurrentUser
) -> ExpenseOut:
    expense = get_or_404(db, Expense, expense_id, "Expense was not found.")
    return serialize_expense(update_expense_service(db, expense, payload))


@router.delete("/expenses/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(expense_id: int, db: DbSession, _: CurrentUser) -> None:
    expense = get_or_404(db, Expense, expense_id, "Expense was not found.")
    delete_expense_service(db, expense)


@router.get("/payroll", response_model=list[PayrollEntryOut])
def list_payroll(
    db: DbSession, _: CurrentUser, month: str | None = None
) -> list[PayrollEntryOut]:
    return [serialize_payroll_entry(row) for row in list_payroll_entries_detailed(db, month)]


@router.post("/payroll", response_model=PayrollEntryOut, status_code=status.HTTP_201_CREATED)
def create_payroll_entry(
    payload: PayrollEntryCreate, db: DbSession, _: CurrentUser
) -> PayrollEntryOut:
    employee = get_or_404(db, Employee, payload.employee_id, "Employee was not found.")
    entry = create_payroll_entry_service(db, payload, employee)
    return serialize_payroll_entry(get_payroll_entry_detailed(db, entry.id))


@router.post("/payroll/generate", response_model=list[PayrollEntryOut])
def generate_payroll(month: str, db: DbSession, _: CurrentUser) -> list[PayrollEntryOut]:
    generate_payroll_for_month(db, month)
    return [serialize_payroll_entry(row) for row in list_payroll_entries_detailed(db, month)]


@router.put("/payroll/{entry_id}", response_model=PayrollEntryOut)
def update_payroll_entry(
    entry_id: int, payload: PayrollEntryUpdate, db: DbSession, _: CurrentUser
) -> PayrollEntryOut:
    entry = get_payroll_entry_detailed(db, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Payroll entry was not found.")
    return serialize_payroll_entry(update_payroll_entry_service(db, entry, payload))


@router.delete("/payroll/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_payroll_entry(entry_id: int, db: DbSession, _: CurrentUser) -> None:
    entry = get_or_404(db, PayrollEntry, entry_id, "Payroll entry was not found.")
    delete_payroll_entry_service(db, entry)


@router.patch("/payroll/{entry_id}/pay", response_model=PayrollEntryOut)
def mark_payroll_paid(
    entry_id: int, payload: PayrollMarkPaid, db: DbSession, _: CurrentUser
) -> PayrollEntryOut:
    entry = get_payroll_entry_detailed(db, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Payroll entry was not found.")
    return serialize_payroll_entry(mark_payroll_paid_service(db, entry, payload))
