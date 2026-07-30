from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.dependencies import CurrentUser, DbSession
from app.core.errors import get_or_404
from app.models import Employee, PayrollEntry
from app.repositories.payroll import get_payroll_entry_detailed
from app.schemas import PayrollEntryCreate, PayrollEntryOut, PayrollEntryUpdate, PayrollMarkPaid
from app.services import create_payroll_entry as create_payroll_entry_service
from app.services import delete_payroll_entry as delete_payroll_entry_service
from app.services import generate_payroll_for_month
from app.services import mark_payroll_paid as mark_payroll_paid_service
from app.services import update_payroll_entry as update_payroll_entry_service

router = APIRouter(tags=["payroll"])


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
    employee = get_or_404(db, Employee, payload.employee_id, "Employee was not found.")
    entry = create_payroll_entry_service(db, payload, employee)
    return serialize_payroll_entry(get_payroll_entry_detailed(db, entry.id))


@router.post("/payroll/generate", response_model=list[PayrollEntryOut])
def generate_payroll(month: str, db: DbSession, user: CurrentUser) -> list[PayrollEntryOut]:
    generate_payroll_for_month(db, month)
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
    entry = get_payroll_entry_detailed(db, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Payroll entry was not found.")
    return serialize_payroll_entry(update_payroll_entry_service(db, entry, payload))


@router.delete("/payroll/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_payroll_entry(entry_id: int, db: DbSession, user: CurrentUser) -> None:
    entry = get_or_404(db, PayrollEntry, entry_id, "Payroll entry was not found.")
    delete_payroll_entry_service(db, entry)


@router.patch("/payroll/{entry_id}/pay", response_model=PayrollEntryOut)
def mark_payroll_paid(
    entry_id: int, payload: PayrollMarkPaid, db: DbSession, user: CurrentUser
) -> PayrollEntryOut:
    entry = get_payroll_entry_detailed(db, entry_id)
    if not entry:
        raise HTTPException(status_code=404, detail="Payroll entry was not found.")
    return serialize_payroll_entry(mark_payroll_paid_service(db, entry, payload))
