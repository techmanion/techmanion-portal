import calendar
from datetime import date

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.models import (
    BankAccount,
    Employee,
    EmployeeStatus,
    PayrollEntry,
    PayrollEntryStatus,
    TransactionSource,
    TransactionType,
    User,
)
from app.schemas import PayrollEntryCreate, PayrollEntryUpdate, PayrollMarkPaid
from app.services.activity import log_activity
from app.services.bank import _build_bank_transaction, _require_active_bank_account, _resolve_pkr_equivalent
from app.services.employees import employee_current_salary


def payroll_period_end(month: str) -> date:
    try:
        year, month_number = (int(part) for part in month.split("-"))
        return date(year, month_number, calendar.monthrange(year, month_number)[1])
    except (TypeError, ValueError):
        raise HTTPException(status_code=422, detail="Month must use YYYY-MM format.") from None


def create_payroll_entry(
    db: Session, payload: PayrollEntryCreate, employee: Employee, actor: User | None = None
) -> PayrollEntry:
    payroll_period_end(payload.month)
    entry = PayrollEntry(
        employee_id=payload.employee_id,
        month=payload.month,
        base_compensation=payload.base_compensation,
        adjustment=payload.adjustment,
        final_amount=payload.base_compensation + payload.adjustment,
        currency=payload.currency,
        notes=payload.notes,
    )
    db.add(entry)
    try:
        db.flush()
        log_activity(
            db,
            "PayrollEntry",
            entry.id,
            "CREATE",
            f"Created {entry.month} payroll for {employee.full_name}",
            performed_by_user_id=actor.id if actor else None,
        )
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409, detail="A payroll entry already exists for this employee and month."
        ) from exc
    return entry


def generate_payroll_for_month(
    db: Session, month: str, actor: User | None = None
) -> list[PayrollEntry]:
    period_date = payroll_period_end(month)
    existing_employee_ids = set(
        db.scalars(select(PayrollEntry.employee_id).where(PayrollEntry.month == month)).all()
    )
    employees = db.scalars(
        select(Employee)
        .where(
            Employee.status == EmployeeStatus.ACTIVE,
            Employee.joining_date <= period_date,
        )
        .options(selectinload(Employee.salary_revisions))
    ).all()
    created_entries: list[PayrollEntry] = []
    for employee in employees:
        if employee.id in existing_employee_ids:
            continue
        salary = employee_current_salary(employee, period_date)
        if not salary:
            continue
        entry = PayrollEntry(
            employee_id=employee.id,
            month=month,
            base_compensation=salary.base_amount,
            adjustment=0,
            final_amount=salary.base_amount,
            currency=salary.currency,
        )
        db.add(entry)
        created_entries.append(entry)
    db.flush()
    employee_names = {employee.id: employee.full_name for employee in employees}
    for entry in created_entries:
        log_activity(
            db,
            "PayrollEntry",
            entry.id,
            "CREATE",
            f"Generated {entry.month} payroll for {employee_names[entry.employee_id]}",
            performed_by_user_id=actor.id if actor else None,
        )
    db.commit()
    return created_entries


def update_payroll_entry(
    db: Session, entry: PayrollEntry, payload: PayrollEntryUpdate, actor: User | None = None
) -> PayrollEntry:
    entry.base_compensation = payload.base_compensation
    entry.adjustment = payload.adjustment
    entry.final_amount = payload.base_compensation + payload.adjustment
    entry.currency = payload.currency
    entry.notes = payload.notes

    transaction = entry.bank_transaction
    if transaction is not None:
        account = transaction.bank_account
        _require_active_bank_account(account)
        transaction.amount = entry.final_amount
        transaction.pkr_equivalent = _resolve_pkr_equivalent(
            account, entry.final_amount, payload.pkr_equivalent
        )

    log_activity(
        db,
        "PayrollEntry",
        entry.id,
        "UPDATE",
        f"Updated {entry.month} payroll for {entry.employee.full_name}",
        performed_by_user_id=actor.id if actor else None,
    )
    db.commit()
    return entry


def delete_payroll_entry(db: Session, entry: PayrollEntry, actor: User | None = None) -> None:
    transaction = entry.bank_transaction
    log_activity(
        db,
        "PayrollEntry",
        entry.id,
        "DELETE",
        f"Deleted {entry.month} payroll for {entry.employee.full_name}",
        performed_by_user_id=actor.id if actor else None,
    )
    db.delete(entry)
    db.flush()
    if transaction is not None:
        db.delete(transaction)
    db.commit()


def mark_payroll_paid(
    db: Session,
    entry: PayrollEntry,
    payload: PayrollMarkPaid,
    account: BankAccount,
    actor: User | None = None,
) -> PayrollEntry:
    if entry.status == PayrollEntryStatus.PAID:
        raise HTTPException(
            status_code=422, detail="Payroll entry is already marked as paid."
        )
    entry.status = PayrollEntryStatus.PAID
    entry.payment_date = payload.payment_date or date.today()
    transaction = _build_bank_transaction(
        db,
        account,
        TransactionType.DEBIT,
        transaction_date=entry.payment_date,
        amount=entry.final_amount,
        pkr_equivalent_supplied=payload.pkr_equivalent,
        description=f"Payroll · {entry.employee.full_name} · {entry.month}",
        source=TransactionSource.PAYROLL,
    )
    entry.bank_transaction_id = transaction.id
    log_activity(
        db,
        "PayrollEntry",
        entry.id,
        "PAID",
        f"Marked {entry.month} payroll paid for {entry.employee.full_name}",
        performed_by_user_id=actor.id if actor else None,
        metadata={"amount": entry.final_amount, "currency": entry.currency},
    )
    db.commit()
    return entry
