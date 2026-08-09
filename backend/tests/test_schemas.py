from datetime import date

import pytest
from pydantic import ValidationError

from app.schemas.activity import ActivityListOut, ActivityOut
from app.schemas.finance import BankAccountCreate, BankTransactionCreate, BankTransferCreate, ExpenseCreate
from app.schemas.payroll import PayrollEntryOut, PayrollMarkPaid
from app.schemas.projects import ProjectCreate, ProjectPaymentCreate


def _fixed_project_payload(**overrides) -> dict:
    payload = {
        "name": "Currency Test Project",
        "client_name": "Acme Co",
        "project_type": "FIXED",
        "start_date": date(2026, 1, 1),
        "contract_value": 100000,
        "currency": "PKR",
    }
    payload.update(overrides)
    return payload


def test_project_create_requires_currency() -> None:
    payload = _fixed_project_payload()
    del payload["currency"]
    with pytest.raises(ValidationError):
        ProjectCreate(**payload)


def test_project_create_rejects_invalid_currency() -> None:
    with pytest.raises(ValidationError):
        ProjectCreate(**_fixed_project_payload(currency="XYZ"))


@pytest.mark.parametrize("currency", ["PKR", "USD", "EUR", "GBP"])
def test_project_create_accepts_allowed_currencies(currency: str) -> None:
    project = ProjectCreate(**_fixed_project_payload(currency=currency))
    assert project.currency.value == currency


def test_project_payment_create_has_no_currency_field() -> None:
    assert "currency" not in ProjectPaymentCreate.model_fields


def _bank_account_payload(**overrides) -> dict:
    payload = {
        "name": "Meezan PKR",
        "bank_name": "Meezan Bank",
        "currency": "PKR",
        "opening_balance": 500000,
    }
    payload.update(overrides)
    if payload["currency"] != "PKR" and "opening_balance_pkr" not in payload:
        payload["opening_balance_pkr"] = payload["opening_balance"]
    return payload


def test_bank_account_create_requires_currency() -> None:
    payload = _bank_account_payload()
    del payload["currency"]
    with pytest.raises(ValidationError):
        BankAccountCreate(**payload)


def test_bank_account_create_rejects_invalid_currency() -> None:
    with pytest.raises(ValidationError):
        BankAccountCreate(**_bank_account_payload(currency="XYZ"))


@pytest.mark.parametrize("currency", ["PKR", "USD", "EUR", "GBP"])
def test_bank_account_create_accepts_allowed_currencies(currency: str) -> None:
    account = BankAccountCreate(**_bank_account_payload(currency=currency))
    assert account.currency.value == currency


def test_bank_account_create_defaults_to_active() -> None:
    account = BankAccountCreate(**_bank_account_payload())
    assert account.is_active is True


def test_bank_account_create_rejects_negative_opening_balance() -> None:
    with pytest.raises(ValidationError):
        BankAccountCreate(**_bank_account_payload(opening_balance=-1))


def test_bank_account_create_has_no_balance_field() -> None:
    assert "balance" not in BankAccountCreate.model_fields


def _bank_transaction_payload(**overrides) -> dict:
    payload = {
        "date": date(2026, 1, 15),
        "amount": 100000,
        "description": "Client invoice settlement",
    }
    payload.update(overrides)
    return payload


def test_bank_transaction_create_requires_positive_amount() -> None:
    with pytest.raises(ValidationError):
        BankTransactionCreate(**_bank_transaction_payload(amount=0))


def test_bank_transaction_create_rejects_negative_amount() -> None:
    with pytest.raises(ValidationError):
        BankTransactionCreate(**_bank_transaction_payload(amount=-500))


def test_bank_transaction_create_rejects_negative_pkr_equivalent() -> None:
    with pytest.raises(ValidationError):
        BankTransactionCreate(**_bank_transaction_payload(pkr_equivalent=-1))


def test_bank_transaction_create_pkr_equivalent_optional() -> None:
    transaction = BankTransactionCreate(**_bank_transaction_payload())
    assert transaction.pkr_equivalent is None


def _bank_transfer_payload(**overrides) -> dict:
    payload = {
        "source_account_id": 1,
        "destination_account_id": 2,
        "source_amount": 100000,
        "destination_amount": 27900000,
        "date": date(2026, 1, 15),
        "description": "Move funds to PKR operating account",
    }
    payload.update(overrides)
    return payload


def test_bank_transfer_create_rejects_same_account() -> None:
    with pytest.raises(ValidationError):
        BankTransferCreate(**_bank_transfer_payload(destination_account_id=1))


def test_bank_transfer_create_rejects_zero_source_amount() -> None:
    with pytest.raises(ValidationError):
        BankTransferCreate(**_bank_transfer_payload(source_amount=0))


def test_bank_transfer_create_rejects_negative_destination_amount() -> None:
    with pytest.raises(ValidationError):
        BankTransferCreate(**_bank_transfer_payload(destination_amount=-1))


def test_bank_transfer_create_accepts_valid_payload() -> None:
    transfer = BankTransferCreate(**_bank_transfer_payload())
    assert transfer.source_account_id == 1
    assert transfer.destination_account_id == 2


def test_bank_account_create_requires_pkr_equivalent_for_non_pkr_opening_balance() -> None:
    payload = _bank_account_payload(currency="USD")
    del payload["opening_balance_pkr"]
    with pytest.raises(ValidationError):
        BankAccountCreate(**payload)


def test_bank_account_create_defaults_pkr_opening_balance_for_pkr_account() -> None:
    account = BankAccountCreate(**_bank_account_payload(currency="PKR", opening_balance=1000))
    assert account.opening_balance_pkr == 1000


def test_project_payment_create_requires_bank_account() -> None:
    payload = {
        "amount": 1000,
        "payment_date": date(2026, 1, 10),
        "method": "Bank transfer",
    }
    with pytest.raises(ValidationError):
        ProjectPaymentCreate(**payload)


def test_expense_create_requires_bank_account() -> None:
    payload = {
        "title": "AWS bill",
        "category": "Infrastructure",
        "amount": 1000,
        "expense_type": "ONE_TIME",
        "date": date(2026, 1, 10),
    }
    with pytest.raises(ValidationError):
        ExpenseCreate(**payload)


def test_payroll_mark_paid_requires_bank_account() -> None:
    with pytest.raises(ValidationError):
        PayrollMarkPaid()


def test_payroll_entry_out_has_pkr_equivalent_field() -> None:
    assert "pkr_equivalent" in PayrollEntryOut.model_fields


def test_activity_out_uses_entity_type_field_name() -> None:
    assert "entity_type" in ActivityOut.model_fields
    assert "entity" not in ActivityOut.model_fields
    assert "performed_by_user_id" in ActivityOut.model_fields
    assert "performed_by_name" in ActivityOut.model_fields
    assert "metadata_json" in ActivityOut.model_fields


def test_activity_list_out_has_pagination_fields() -> None:
    assert set(ActivityListOut.model_fields) == {"items", "total", "page", "page_size"}
