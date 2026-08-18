from datetime import date
from uuid import uuid4

import pytest
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from sqlalchemy import select

from app.models import (
    ActivityLog,
    BankAccount,
    BankTransaction,
    Currency,
    Designation,
    Employee,
    PayrollEntry,
    PayrollEntryStatus,
    SalaryRevision,
    TransactionSource,
    User,
)
from app.schemas.finance import (
    BankAccountCreate,
    BankTransactionCreate,
    BankTransferCreate,
    ExpenseCreate,
    ExpenseUpdate,
)
from app.schemas.payroll import PayrollBackfillBankTransaction, PayrollEntryUpdate, PayrollMarkPaid
from app.schemas.projects import ProjectCreate, ProjectPaymentCreate, ProjectUpdate
from app.services import (
    add_bank_credit,
    add_bank_debit,
    add_project_payment,
    backfill_payroll_bank_transaction,
    bank_account_balance,
    build_finance_overview,
    create_bank_account,
    create_bank_transfer,
    create_expense,
    create_project,
    delete_expense,
    delete_project_payment,
    employee_current_salary,
    list_activity,
    mark_payroll_paid,
    update_bank_account,
    update_expense,
    update_payroll_entry,
    update_project,
)


def _create_actor(db: Session, **overrides) -> User:
    values = {
        "email": f"actor-{uuid4().hex[:10]}@example.com",
        "password_hash": "hashed",
        "name": "Actor",
    }
    values.update(overrides)
    actor = User(**values)
    db.add(actor)
    db.flush()
    return actor


def _latest_activity_log(db: Session, entity_type: str, entity_id: int | str) -> ActivityLog:
    log = db.scalar(
        select(ActivityLog)
        .where(ActivityLog.entity_type == entity_type, ActivityLog.entity_id == str(entity_id))
        .order_by(ActivityLog.id.desc())
    )
    assert log is not None, f"no activity log found for {entity_type}/{entity_id}"
    return log


def _create_bank_account(db: Session, **overrides) -> BankAccount:
    return create_bank_account(db, _bank_account_payload(**overrides))


def _create_employee(db: Session) -> Employee:
    designation = Designation(name=f"Engineer {uuid4().hex[:8]}")
    db.add(designation)
    db.flush()
    employee = Employee(
        first_name="Jane",
        last_name="Doe",
        cnic=f"CNIC-{uuid4().hex[:10]}",
        email=f"jane-{uuid4().hex[:10]}@example.com",
        phone="03000000000",
        employee_type="EMPLOYEE",
        compensation_type="FIXED",
        designation_id=designation.id,
        joining_date=date(2025, 1, 1),
    )
    db.add(employee)
    db.flush()
    return employee


def _create_payroll_entry(db: Session, **overrides) -> PayrollEntry:
    employee = overrides.pop("employee", None) or _create_employee(db)
    values = {
        "employee_id": employee.id,
        "month": "2026-01",
        "base_compensation": 100_000_00,
        "adjustment": 0,
        "final_amount": 100_000_00,
        "currency": "PKR",
    }
    values.update(overrides)
    entry = PayrollEntry(**values)
    db.add(entry)
    db.flush()
    return entry


def test_current_salary_uses_latest_effective_revision() -> None:
    employee = Employee(
        first_name="Test",
        last_name="Employee",
        cnic="TEST-CNIC",
        email="employee@example.com",
        phone="0000",
        employee_type="EMPLOYEE",
        joining_date=date(2025, 1, 1),
    )
    employee.salary_revisions = [
        SalaryRevision(
            base_amount=100_000_00,
            currency="PKR",
            effective_date=date(2025, 1, 1),
            created_by_user_id=1,
        ),
        SalaryRevision(
            base_amount=120_000_00,
            currency="PKR",
            effective_date=date(2026, 1, 1),
            created_by_user_id=1,
        ),
    ]

    current = employee_current_salary(employee, date(2025, 12, 1))

    assert current is not None
    assert current.base_amount == 100_000_00


def test_create_project_persists_selected_currency(db_session: Session) -> None:
    payload = ProjectCreate(
        name=f"USD Project {date.today().isoformat()}",
        client_name="Acme Co",
        project_type="FIXED",
        start_date=date(2026, 1, 1),
        contract_value=500000,
        currency="USD",
    )

    project = create_project(db_session, payload)

    assert project.currency == Currency.USD


def test_add_project_payment_does_not_alter_project_currency(db_session: Session) -> None:
    payload = ProjectCreate(
        name=f"EUR Project {date.today().isoformat()}",
        client_name="Acme Co",
        project_type="FIXED",
        start_date=date(2026, 1, 1),
        contract_value=500000,
        currency="EUR",
    )
    project = create_project(db_session, payload)
    account = create_bank_account(
        db_session, _bank_account_payload(name="Wise EUR", currency="EUR")
    )

    payment_payload = ProjectPaymentCreate(
        amount=100000,
        payment_date=date(2026, 1, 15),
        method="Bank transfer",
        bank_account_id=account.id,
        pkr_equivalent=27_900_00,
    )
    payment = add_project_payment(db_session, project, payment_payload, account)

    assert project.currency == Currency.EUR
    assert payment.project_id == project.id
    assert not hasattr(payment, "currency")
    assert payment.bank_transaction_id is not None
    assert bank_account_balance(account) == 500_000_00 + 100000


def _bank_account_payload(**overrides) -> BankAccountCreate:
    payload = {
        "name": f"Meezan PKR {date.today().isoformat()}",
        "bank_name": "Meezan Bank",
        "currency": "PKR",
        "opening_balance": 500_000_00,
    }
    payload.update(overrides)
    if payload["currency"] != "PKR" and "opening_balance_pkr" not in payload:
        payload["opening_balance_pkr"] = payload["opening_balance"]
    return BankAccountCreate(**payload)


def test_create_bank_account_persists_fields(db_session: Session) -> None:
    account = create_bank_account(db_session, _bank_account_payload())

    assert account.id is not None
    assert account.currency == Currency.PKR
    assert account.is_active is True


def test_bank_account_balance_equals_opening_balance_when_no_transactions(
    db_session: Session,
) -> None:
    account = create_bank_account(db_session, _bank_account_payload(opening_balance=10_000_00))

    assert bank_account_balance(account) == 10_000_00


def test_add_bank_credit_increases_balance(db_session: Session) -> None:
    account = create_bank_account(db_session, _bank_account_payload(opening_balance=0))

    add_bank_credit(
        db_session,
        account,
        BankTransactionCreate(date=date(2026, 1, 10), amount=50_000_00, description="Invoice"),
    )

    assert bank_account_balance(account) == 50_000_00


def test_add_bank_debit_decreases_balance(db_session: Session) -> None:
    account = create_bank_account(db_session, _bank_account_payload(opening_balance=100_000_00))

    add_bank_debit(
        db_session,
        account,
        BankTransactionCreate(date=date(2026, 1, 10), amount=30_000_00, description="Vendor bill"),
    )

    assert bank_account_balance(account) == 70_000_00


def test_add_bank_credit_forces_pkr_equivalent_for_pkr_account(db_session: Session) -> None:
    account = create_bank_account(db_session, _bank_account_payload())

    transaction = add_bank_credit(
        db_session,
        account,
        BankTransactionCreate(date=date(2026, 1, 10), amount=25_000_00, description="Payment"),
    )

    assert transaction.pkr_equivalent == 25_000_00


def test_add_bank_credit_requires_pkr_equivalent_for_non_pkr_account(db_session: Session) -> None:
    account = create_bank_account(db_session, _bank_account_payload(currency="USD"))

    with pytest.raises(HTTPException):
        add_bank_credit(
            db_session,
            account,
            BankTransactionCreate(date=date(2026, 1, 10), amount=1_000_00, description="Payment"),
        )


def test_add_bank_credit_accepts_supplied_pkr_equivalent_for_non_pkr_account(
    db_session: Session,
) -> None:
    account = create_bank_account(db_session, _bank_account_payload(currency="USD"))

    transaction = add_bank_credit(
        db_session,
        account,
        BankTransactionCreate(
            date=date(2026, 1, 10),
            amount=1_000_00,
            pkr_equivalent=279_000_00,
            description="Payment",
        ),
    )

    assert transaction.pkr_equivalent == 279_000_00


def test_add_bank_transaction_rejected_for_inactive_account(db_session: Session) -> None:
    account = create_bank_account(db_session, _bank_account_payload(is_active=False))

    with pytest.raises(HTTPException):
        add_bank_credit(
            db_session,
            account,
            BankTransactionCreate(date=date(2026, 1, 10), amount=1_000_00, description="Payment"),
        )


def test_create_bank_transfer_same_currency_updates_both_balances(db_session: Session) -> None:
    source = create_bank_account(
        db_session, _bank_account_payload(name="Source PKR", opening_balance=100_000_00)
    )
    destination = create_bank_account(
        db_session, _bank_account_payload(name="Destination PKR", opening_balance=0)
    )

    create_bank_transfer(
        db_session,
        source,
        destination,
        BankTransferCreate(
            source_account_id=source.id,
            destination_account_id=destination.id,
            source_amount=40_000_00,
            destination_amount=40_000_00,
            date=date(2026, 1, 10),
            description="Move operating funds",
        ),
    )

    assert bank_account_balance(source) == 60_000_00
    assert bank_account_balance(destination) == 40_000_00


def test_create_bank_transfer_rejects_mismatched_amount_for_same_currency(
    db_session: Session,
) -> None:
    source = create_bank_account(
        db_session, _bank_account_payload(name="Source PKR", opening_balance=100_000_00)
    )
    destination = create_bank_account(
        db_session, _bank_account_payload(name="Destination PKR", opening_balance=0)
    )

    with pytest.raises(HTTPException):
        create_bank_transfer(
            db_session,
            source,
            destination,
            BankTransferCreate(
                source_account_id=source.id,
                destination_account_id=destination.id,
                source_amount=40_000_00,
                destination_amount=39_000_00,
                date=date(2026, 1, 10),
                description="Move operating funds",
            ),
        )


def test_create_bank_transfer_cross_currency_uses_pkr_leg_for_equivalent(
    db_session: Session,
) -> None:
    source = create_bank_account(
        db_session,
        _bank_account_payload(name="Deel USD", currency="USD", opening_balance=5_000_00),
    )
    destination = create_bank_account(
        db_session,
        _bank_account_payload(name="Meezan PKR", currency="PKR", opening_balance=0),
    )

    debit_leg, credit_leg = create_bank_transfer(
        db_session,
        source,
        destination,
        BankTransferCreate(
            source_account_id=source.id,
            destination_account_id=destination.id,
            source_amount=1_000_00,
            destination_amount=279_000_00,
            date=date(2026, 1, 10),
            description="Deel payout to PKR account",
        ),
    )

    assert bank_account_balance(source) == 4_000_00
    assert bank_account_balance(destination) == 279_000_00
    assert debit_leg.pkr_equivalent == 279_000_00
    assert credit_leg.pkr_equivalent == 279_000_00
    assert debit_leg.transfer_id == credit_leg.transfer_id
    assert debit_leg.counterparty_account_id == destination.id
    assert credit_leg.counterparty_account_id == source.id
    assert debit_leg.is_transfer is True
    assert credit_leg.is_transfer is True


def test_create_bank_transfer_requires_pkr_equivalent_when_neither_account_is_pkr(
    db_session: Session,
) -> None:
    source = create_bank_account(
        db_session, _bank_account_payload(name="Deel USD", currency="USD", opening_balance=5_000_00)
    )
    destination = create_bank_account(
        db_session, _bank_account_payload(name="Wise EUR", currency="EUR", opening_balance=0)
    )

    with pytest.raises(HTTPException):
        create_bank_transfer(
            db_session,
            source,
            destination,
            BankTransferCreate(
                source_account_id=source.id,
                destination_account_id=destination.id,
                source_amount=1_000_00,
                destination_amount=900_00,
                date=date(2026, 1, 10),
                description="USD to EUR transfer",
            ),
        )


def test_create_bank_transfer_rejects_same_account(db_session: Session) -> None:
    # BankTransferCreate itself rejects mismatched ids at the schema layer (see
    # test_schemas.py); this covers the service-level guard for callers that
    # bypass schema validation (e.g. model_construct).
    account = create_bank_account(db_session, _bank_account_payload(opening_balance=100_000_00))
    payload = BankTransferCreate.model_construct(
        source_account_id=account.id,
        destination_account_id=account.id,
        source_amount=1_000_00,
        destination_amount=1_000_00,
        date=date(2026, 1, 10),
        description="Self transfer",
        notes=None,
        pkr_equivalent=None,
    )

    with pytest.raises(HTTPException):
        create_bank_transfer(db_session, account, account, payload)


def test_create_bank_transfer_rejects_inactive_account(db_session: Session) -> None:
    source = create_bank_account(
        db_session, _bank_account_payload(name="Source PKR", opening_balance=100_000_00)
    )
    destination = create_bank_account(
        db_session,
        _bank_account_payload(name="Destination PKR", opening_balance=0, is_active=False),
    )

    with pytest.raises(HTTPException):
        create_bank_transfer(
            db_session,
            source,
            destination,
            BankTransferCreate(
                source_account_id=source.id,
                destination_account_id=destination.id,
                source_amount=1_000_00,
                destination_amount=1_000_00,
                date=date(2026, 1, 10),
                description="Move funds",
            ),
        )


def test_create_bank_transfer_is_atomic_when_a_leg_fails(db_session: Session) -> None:
    source = create_bank_account(
        db_session, _bank_account_payload(name="Source PKR", opening_balance=100_000_00)
    )
    ghost_destination = BankAccount(
        name="Ghost",
        bank_name="Ghost Bank",
        currency=Currency.PKR,
        opening_balance=0,
        is_active=True,
    )

    with pytest.raises(IntegrityError):
        create_bank_transfer(
            db_session,
            source,
            ghost_destination,
            BankTransferCreate(
                source_account_id=source.id,
                destination_account_id=0,
                source_amount=1_000_00,
                destination_amount=1_000_00,
                date=date(2026, 1, 10),
                description="Should not persist",
            ),
        )

    db_session.rollback()
    refreshed = db_session.get(BankAccount, source.id)
    assert bank_account_balance(refreshed) == 100_000_00
    assert len(refreshed.transactions) == 0


def test_project_currency_immutable_after_first_payment(db_session: Session) -> None:
    payload = ProjectCreate(
        name=f"Immutable Currency Project {date.today().isoformat()}",
        client_name="Acme Co",
        project_type="FIXED",
        start_date=date(2026, 1, 1),
        contract_value=500000,
        currency="USD",
    )
    project = create_project(db_session, payload)
    account = create_bank_account(db_session, _bank_account_payload(currency="USD"))
    add_project_payment(
        db_session,
        project,
        ProjectPaymentCreate(
            amount=100000,
            payment_date=date(2026, 1, 15),
            method="Bank transfer",
            bank_account_id=account.id,
            pkr_equivalent=27_900_00,
        ),
        account,
    )

    update_payload = ProjectUpdate(
        name=project.name,
        client_name=project.client_name,
        project_type="FIXED",
        start_date=date(2026, 1, 1),
        contract_value=500000,
        currency="EUR",
    )

    with pytest.raises(HTTPException):
        update_project(db_session, project, update_payload)


def test_project_currency_editable_before_any_payment(db_session: Session) -> None:
    payload = ProjectCreate(
        name=f"Mutable Currency Project {date.today().isoformat()}",
        client_name="Acme Co",
        project_type="FIXED",
        start_date=date(2026, 1, 1),
        contract_value=500000,
        currency="USD",
    )
    project = create_project(db_session, payload)

    update_payload = ProjectUpdate(
        name=project.name,
        client_name=project.client_name,
        project_type="FIXED",
        start_date=date(2026, 1, 1),
        contract_value=500000,
        currency="EUR",
    )

    updated = update_project(db_session, project, update_payload)

    assert updated.currency == Currency.EUR


def test_create_expense_creates_linked_bank_debit(db_session: Session) -> None:
    account = _create_bank_account(db_session, opening_balance=100_000_00)

    expense = create_expense(
        db_session,
        ExpenseCreate(
            title="AWS bill",
            category="Infrastructure",
            amount=10_000_00,
            expense_type="ONE_TIME",
            date=date(2026, 1, 10),
            bank_account_id=account.id,
        ),
        account,
    )

    assert expense.bank_transaction_id is not None
    assert expense.bank_transaction.transaction_type.value == "DEBIT"
    assert bank_account_balance(account) == 90_000_00


def test_create_expense_rejects_currency_mismatch(db_session: Session) -> None:
    account = _create_bank_account(db_session, currency="USD")

    with pytest.raises(HTTPException):
        create_expense(
            db_session,
            ExpenseCreate(
                title="AWS bill",
                category="Infrastructure",
                currency="PKR",
                amount=10_000_00,
                expense_type="ONE_TIME",
                date=date(2026, 1, 10),
                bank_account_id=account.id,
                pkr_equivalent=10_000_00,
            ),
            account,
        )


def test_update_expense_updates_linked_transaction(db_session: Session) -> None:
    account = _create_bank_account(db_session, opening_balance=100_000_00)
    expense = create_expense(
        db_session,
        ExpenseCreate(
            title="AWS bill",
            category="Infrastructure",
            amount=10_000_00,
            expense_type="ONE_TIME",
            date=date(2026, 1, 10),
            bank_account_id=account.id,
        ),
        account,
    )

    updated = update_expense(
        db_session,
        expense,
        ExpenseUpdate(
            title="AWS bill",
            category="Infrastructure",
            amount=15_000_00,
            expense_type="ONE_TIME",
            date=date(2026, 1, 12),
            bank_account_id=account.id,
        ),
        account,
    )

    assert updated.bank_transaction.amount == 15_000_00
    assert bank_account_balance(account) == 85_000_00


def test_delete_expense_deletes_linked_transaction(db_session: Session) -> None:
    account = _create_bank_account(db_session, opening_balance=100_000_00)
    expense = create_expense(
        db_session,
        ExpenseCreate(
            title="AWS bill",
            category="Infrastructure",
            amount=10_000_00,
            expense_type="ONE_TIME",
            date=date(2026, 1, 10),
            bank_account_id=account.id,
        ),
        account,
    )
    transaction_id = expense.bank_transaction_id

    delete_expense(db_session, expense)

    assert db_session.get(BankTransaction, transaction_id) is None
    assert bank_account_balance(account) == 100_000_00


def test_add_project_payment_rejects_currency_mismatch(db_session: Session) -> None:
    project = create_project(
        db_session,
        ProjectCreate(
            name=f"USD Project {uuid4().hex[:8]}",
            client_name="Acme Co",
            project_type="FIXED",
            start_date=date(2026, 1, 1),
            contract_value=500000,
            currency="USD",
        ),
    )
    account = _create_bank_account(db_session, currency="PKR")

    with pytest.raises(HTTPException):
        add_project_payment(
            db_session,
            project,
            ProjectPaymentCreate(
                amount=1000,
                payment_date=date(2026, 1, 15),
                method="Bank transfer",
                bank_account_id=account.id,
            ),
            account,
        )


def test_delete_project_payment_deletes_linked_transaction(db_session: Session) -> None:
    project = create_project(
        db_session,
        ProjectCreate(
            name=f"PKR Project {uuid4().hex[:8]}",
            client_name="Acme Co",
            project_type="FIXED",
            start_date=date(2026, 1, 1),
            contract_value=500000,
            currency="PKR",
        ),
    )
    account = _create_bank_account(db_session, opening_balance=0)
    payment = add_project_payment(
        db_session,
        project,
        ProjectPaymentCreate(
            amount=50_000_00,
            payment_date=date(2026, 1, 15),
            method="Bank transfer",
            bank_account_id=account.id,
        ),
        account,
    )
    transaction_id = payment.bank_transaction_id

    delete_project_payment(db_session, project, payment)

    assert db_session.get(BankTransaction, transaction_id) is None
    assert bank_account_balance(account) == 0


def test_update_bank_account_locks_currency_once_transactions_exist(db_session: Session) -> None:
    account = _create_bank_account(db_session, opening_balance=0)
    add_bank_credit(
        db_session,
        account,
        BankTransactionCreate(date=date(2026, 1, 10), amount=1_000_00, description="Deposit"),
    )

    with pytest.raises(HTTPException):
        update_bank_account(
            db_session,
            account,
            BankAccountCreate(
                name=account.name,
                bank_name=account.bank_name,
                currency="USD",
                opening_balance=0,
                opening_balance_pkr=0,
            ),
        )


def test_mark_payroll_paid_creates_linked_bank_debit(db_session: Session) -> None:
    account = _create_bank_account(db_session, opening_balance=200_000_00)
    entry = _create_payroll_entry(db_session, final_amount=90_000_00)

    paid = mark_payroll_paid(
        db_session, entry, PayrollMarkPaid(bank_account_id=account.id), account
    )

    assert paid.status == PayrollEntryStatus.PAID
    assert paid.bank_transaction_id is not None
    assert paid.bank_transaction.amount == 90_000_00
    assert bank_account_balance(account) == 110_000_00


def test_mark_payroll_paid_twice_raises(db_session: Session) -> None:
    account = _create_bank_account(db_session, opening_balance=200_000_00)
    entry = _create_payroll_entry(db_session, final_amount=90_000_00)
    mark_payroll_paid(db_session, entry, PayrollMarkPaid(bank_account_id=account.id), account)

    with pytest.raises(HTTPException):
        mark_payroll_paid(db_session, entry, PayrollMarkPaid(bank_account_id=account.id), account)


def test_backfill_payroll_bank_transaction_links_legacy_paid_entry(db_session: Session) -> None:
    account = _create_bank_account(db_session, opening_balance=200_000_00)
    entry = _create_payroll_entry(
        db_session,
        final_amount=90_000_00,
        status=PayrollEntryStatus.PAID,
        payment_date=date(2026, 1, 31),
    )

    linked = backfill_payroll_bank_transaction(
        db_session, entry, PayrollBackfillBankTransaction(bank_account_id=account.id), account
    )

    assert linked.bank_transaction_id is not None
    assert linked.bank_transaction.amount == 90_000_00
    assert linked.bank_transaction.source == TransactionSource.PAYROLL
    assert bank_account_balance(account) == 110_000_00


def test_backfill_payroll_bank_transaction_rejects_pending_entry(db_session: Session) -> None:
    account = _create_bank_account(db_session, opening_balance=200_000_00)
    entry = _create_payroll_entry(db_session, final_amount=90_000_00)

    with pytest.raises(HTTPException):
        backfill_payroll_bank_transaction(
            db_session, entry, PayrollBackfillBankTransaction(bank_account_id=account.id), account
        )


def test_backfill_payroll_bank_transaction_rejects_already_linked_entry(db_session: Session) -> None:
    account = _create_bank_account(db_session, opening_balance=200_000_00)
    entry = _create_payroll_entry(db_session, final_amount=90_000_00)
    mark_payroll_paid(db_session, entry, PayrollMarkPaid(bank_account_id=account.id), account)

    with pytest.raises(HTTPException):
        backfill_payroll_bank_transaction(
            db_session, entry, PayrollBackfillBankTransaction(bank_account_id=account.id), account
        )


def test_update_payroll_entry_after_paid_updates_linked_transaction(db_session: Session) -> None:
    account = _create_bank_account(db_session, opening_balance=200_000_00)
    entry = _create_payroll_entry(db_session, final_amount=90_000_00)
    mark_payroll_paid(db_session, entry, PayrollMarkPaid(bank_account_id=account.id), account)

    updated = update_payroll_entry(
        db_session,
        entry,
        PayrollEntryUpdate(base_compensation=95_000_00, adjustment=0, currency="PKR"),
    )

    assert updated.final_amount == 95_000_00
    assert updated.bank_transaction.amount == 95_000_00
    assert bank_account_balance(account) == 105_000_00


def test_delete_payroll_entry_deletes_linked_transaction(db_session: Session) -> None:
    from app.services import delete_payroll_entry

    account = _create_bank_account(db_session, opening_balance=200_000_00)
    entry = _create_payroll_entry(db_session, final_amount=90_000_00)
    mark_payroll_paid(db_session, entry, PayrollMarkPaid(bank_account_id=account.id), account)
    transaction_id = entry.bank_transaction_id

    delete_payroll_entry(db_session, entry)

    assert db_session.get(BankTransaction, transaction_id) is None
    assert bank_account_balance(account) == 200_000_00


def test_build_finance_overview_reconciles_to_zero_when_fully_linked(db_session: Session) -> None:
    account = _create_bank_account(db_session, opening_balance=0)
    project = create_project(
        db_session,
        ProjectCreate(
            name=f"Reconciled Project {uuid4().hex[:8]}",
            client_name="Acme Co",
            project_type="FIXED",
            start_date=date(2026, 1, 1),
            contract_value=500000,
            currency="PKR",
        ),
    )
    add_project_payment(
        db_session,
        project,
        ProjectPaymentCreate(
            amount=200_000_00,
            payment_date=date(2026, 1, 15),
            method="Bank transfer",
            bank_account_id=account.id,
        ),
        account,
    )
    create_expense(
        db_session,
        ExpenseCreate(
            title="AWS bill",
            category="Infrastructure",
            amount=50_000_00,
            expense_type="ONE_TIME",
            date=date(2026, 1, 16),
            bank_account_id=account.id,
        ),
        account,
    )
    entry = _create_payroll_entry(db_session, final_amount=30_000_00)
    mark_payroll_paid(db_session, entry, PayrollMarkPaid(bank_account_id=account.id), account)

    overview = build_finance_overview(db_session)

    assert overview.total_income == 200_000_00
    assert overview.total_expenses == 80_000_00
    assert overview.bank_balance == 120_000_00
    assert overview.net_position == 120_000_00
    assert overview.unreconciled_amount == 0


def test_build_finance_overview_flags_unreconciled_manual_bank_activity(db_session: Session) -> None:
    account = _create_bank_account(db_session, opening_balance=0)
    add_bank_credit(
        db_session,
        account,
        BankTransactionCreate(date=date(2026, 1, 5), amount=25_000_00, description="Owner deposit"),
    )

    overview = build_finance_overview(db_session)

    assert overview.total_income == 0
    assert overview.bank_balance == 25_000_00
    assert overview.unreconciled_amount == -25_000_00


def test_build_finance_overview_excludes_transfers_from_income_and_expenses(
    db_session: Session,
) -> None:
    source = _create_bank_account(db_session, opening_balance=0)
    destination = _create_bank_account(db_session, opening_balance=0)

    create_bank_transfer(
        db_session,
        source,
        destination,
        BankTransferCreate(
            source_account_id=source.id,
            destination_account_id=destination.id,
            source_amount=40_000_00,
            destination_amount=40_000_00,
            date=date(2026, 1, 10),
            description="Move operating funds",
        ),
    )

    overview = build_finance_overview(db_session)

    assert overview.total_income == 0
    assert overview.total_expenses == 0
    assert overview.bank_balance == 0
    assert overview.unreconciled_amount == 0


def test_build_finance_overview_opening_balance_does_not_inflate_unreconciled(
    db_session: Session,
) -> None:
    # An opening balance is capital contributed to the business, not income, so it
    # must not appear as "unreconciled" just because no income/expense explains it.
    _create_bank_account(db_session, opening_balance=500_000_00)

    overview = build_finance_overview(db_session)

    assert overview.total_income == 0
    assert overview.bank_balance == 500_000_00
    assert overview.unreconciled_amount == 0


def test_build_finance_overview_opening_balance_plus_manual_credit_flags_only_the_credit(
    db_session: Session,
) -> None:
    account = _create_bank_account(db_session, opening_balance=500_000_00)
    add_bank_credit(
        db_session,
        account,
        BankTransactionCreate(date=date(2026, 1, 5), amount=25_000_00, description="Owner top-up"),
    )

    overview = build_finance_overview(db_session)

    assert overview.bank_balance == 525_000_00
    assert overview.unreconciled_amount == -25_000_00


def test_create_bank_account_logs_performed_by_user(db_session: Session) -> None:
    actor = _create_actor(db_session)

    account = create_bank_account(db_session, _bank_account_payload(), actor)

    log = _latest_activity_log(db_session, "BankAccount", account.id)
    assert log.action == "CREATE"
    assert log.performed_by_user_id == actor.id
    assert log.performed_by_name == actor.name


def test_create_bank_account_without_actor_logs_no_user(db_session: Session) -> None:
    account = create_bank_account(db_session, _bank_account_payload())

    log = _latest_activity_log(db_session, "BankAccount", account.id)
    assert log.performed_by_user_id is None


def test_update_bank_account_deactivate_logs_deactivate_action(db_session: Session) -> None:
    account = _create_bank_account(db_session)

    update_bank_account(
        db_session,
        account,
        BankAccountCreate(
            name=account.name,
            bank_name=account.bank_name,
            currency=account.currency,
            opening_balance=account.opening_balance,
            opening_balance_pkr=account.opening_balance_pkr,
            is_active=False,
        ),
    )

    log = _latest_activity_log(db_session, "BankAccount", account.id)
    assert log.action == "DEACTIVATE"


def test_update_bank_account_reactivate_logs_activate_action(db_session: Session) -> None:
    account = _create_bank_account(db_session, is_active=False)

    update_bank_account(
        db_session,
        account,
        BankAccountCreate(
            name=account.name,
            bank_name=account.bank_name,
            currency=account.currency,
            opening_balance=account.opening_balance,
            opening_balance_pkr=account.opening_balance_pkr,
            is_active=True,
        ),
    )

    log = _latest_activity_log(db_session, "BankAccount", account.id)
    assert log.action == "ACTIVATE"


def test_add_bank_credit_creates_manual_source_transaction(db_session: Session) -> None:
    account = _create_bank_account(db_session, opening_balance=0)

    transaction = add_bank_credit(
        db_session,
        account,
        BankTransactionCreate(date=date(2026, 1, 10), amount=1_000_00, description="Deposit"),
    )

    assert transaction.source == TransactionSource.MANUAL
    assert transaction.is_reconciled is False
    log = _latest_activity_log(db_session, "BankTransaction", transaction.id)
    assert log.action == "CREATE"


def test_create_expense_sets_transaction_source_and_logs_actor(db_session: Session) -> None:
    actor = _create_actor(db_session)
    account = _create_bank_account(db_session, opening_balance=100_000_00)

    expense = create_expense(
        db_session,
        ExpenseCreate(
            title="AWS bill",
            category="Infrastructure",
            amount=10_000_00,
            expense_type="ONE_TIME",
            date=date(2026, 1, 10),
            bank_account_id=account.id,
        ),
        account,
        actor,
    )

    assert expense.bank_transaction.source == TransactionSource.EXPENSE
    assert expense.bank_transaction.is_reconciled is True
    log = _latest_activity_log(db_session, "Expense", expense.id)
    assert log.performed_by_user_id == actor.id
    assert log.metadata_json == {"amount": expense.amount, "currency": expense.currency}


def test_add_project_payment_sets_transaction_source_income(db_session: Session) -> None:
    project = create_project(
        db_session,
        ProjectCreate(
            name=f"Income Source Project {uuid4().hex[:8]}",
            client_name="Acme Co",
            project_type="FIXED",
            start_date=date(2026, 1, 1),
            contract_value=500000,
            currency="PKR",
        ),
    )
    account = _create_bank_account(db_session, opening_balance=0)

    payment = add_project_payment(
        db_session,
        project,
        ProjectPaymentCreate(
            amount=50_000_00,
            payment_date=date(2026, 1, 15),
            method="Bank transfer",
            bank_account_id=account.id,
        ),
        account,
    )

    assert payment.bank_transaction.source == TransactionSource.INCOME
    log = _latest_activity_log(db_session, "ProjectPayment", payment.id)
    assert log.action == "CREATE"


def test_mark_payroll_paid_sets_transaction_source_payroll(db_session: Session) -> None:
    account = _create_bank_account(db_session, opening_balance=200_000_00)
    entry = _create_payroll_entry(db_session, final_amount=90_000_00)

    paid = mark_payroll_paid(
        db_session, entry, PayrollMarkPaid(bank_account_id=account.id), account
    )

    assert paid.bank_transaction.source == TransactionSource.PAYROLL
    log = _latest_activity_log(db_session, "PayrollEntry", entry.id)
    assert log.action == "PAID"


def test_create_bank_transfer_sets_transfer_source_and_logs_metadata(db_session: Session) -> None:
    actor = _create_actor(db_session)
    source = _create_bank_account(db_session, name="Source PKR", opening_balance=100_000_00)
    destination = _create_bank_account(db_session, name="Destination PKR", opening_balance=0)

    debit_leg, credit_leg = create_bank_transfer(
        db_session,
        source,
        destination,
        BankTransferCreate(
            source_account_id=source.id,
            destination_account_id=destination.id,
            source_amount=40_000_00,
            destination_amount=40_000_00,
            date=date(2026, 1, 10),
            description="Move operating funds",
        ),
        actor,
    )

    assert debit_leg.source == TransactionSource.TRANSFER
    assert credit_leg.source == TransactionSource.TRANSFER
    assert debit_leg.is_reconciled is True
    log = _latest_activity_log(db_session, "BankTransfer", debit_leg.transfer_id)
    assert log.performed_by_user_id == actor.id
    assert log.metadata_json == {
        "source_account_id": source.id,
        "destination_account_id": destination.id,
        "source_amount": 40_000_00,
        "destination_amount": 40_000_00,
    }


def test_list_activity_filters_by_entity_type_and_paginates(db_session: Session) -> None:
    actor = _create_actor(db_session)
    for index in range(3):
        create_bank_account(db_session, _bank_account_payload(name=f"Filter Test {index}"), actor)
    create_project(
        db_session,
        ProjectCreate(
            name=f"Unrelated Project {uuid4().hex[:8]}",
            client_name="Acme Co",
            project_type="FIXED",
            start_date=date(2026, 1, 1),
            contract_value=500000,
            currency="PKR",
        ),
    )

    result = list_activity(db_session, entity_type="BankAccount", page=1, page_size=2)

    assert result.total >= 3
    assert len(result.items) == 2
    assert all(item.entity_type == "BankAccount" for item in result.items)
    assert all(item.performed_by_user_id == actor.id for item in result.items)


def test_list_activity_filters_by_performed_by_user(db_session: Session) -> None:
    actor_a = _create_actor(db_session)
    actor_b = _create_actor(db_session)
    create_bank_account(db_session, _bank_account_payload(name=f"By A {uuid4().hex[:6]}"), actor_a)
    create_bank_account(db_session, _bank_account_payload(name=f"By B {uuid4().hex[:6]}"), actor_b)

    result = list_activity(db_session, performed_by_user_id=actor_a.id)

    assert result.total >= 1
    assert all(item.performed_by_user_id == actor_a.id for item in result.items)
