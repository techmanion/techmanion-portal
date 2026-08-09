from datetime import date

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.main import app
from app.models import ActivityLog


def test_health() -> None:
    client = TestClient(app)
    health = client.get("/health")
    assert health.status_code == 200
    assert health.json() == {"status": "ok"}


def test_protected_resource_rejects_anonymous_request() -> None:
    client = TestClient(app)
    response = client.get("/admin/employees")
    assert response.status_code == 401


def _project_payload(**overrides) -> dict:
    payload = {
        "name": f"API Currency Project {date.today().isoformat()}",
        "clientName": "Acme Co",
        "projectType": "FIXED",
        "status": "PLANNED",
        "startDate": "2026-01-01",
        "contractValue": 500000,
        "currency": "GBP",
        "milestones": [],
    }
    payload.update(overrides)
    return payload


def test_create_project_requires_currency(
    api_client: TestClient, executive_headers: dict[str, str]
) -> None:
    payload = _project_payload()
    del payload["currency"]
    response = api_client.post("/admin/projects", json=payload, headers=executive_headers)
    assert response.status_code == 422


def test_create_project_rejects_invalid_currency(
    api_client: TestClient, executive_headers: dict[str, str]
) -> None:
    response = api_client.post(
        "/admin/projects", json=_project_payload(currency="XYZ"), headers=executive_headers
    )
    assert response.status_code == 422


def test_create_project_returns_currency(
    api_client: TestClient, executive_headers: dict[str, str]
) -> None:
    response = api_client.post(
        "/admin/projects", json=_project_payload(), headers=executive_headers
    )
    assert response.status_code == 201
    body = response.json()
    assert body["currency"] == "GBP"

    fetched = api_client.get(f"/admin/projects/{body['id']}", headers=executive_headers)
    assert fetched.status_code == 200
    assert fetched.json()["currency"] == "GBP"


def test_project_payment_ignores_client_supplied_currency(
    api_client: TestClient, executive_headers: dict[str, str]
) -> None:
    created = api_client.post(
        "/admin/projects", json=_project_payload(), headers=executive_headers
    )
    project_id = created.json()["id"]
    account = api_client.post(
        "/admin/finance/bank-accounts",
        json=_bank_account_payload(currency="GBP"),
        headers=executive_headers,
    ).json()

    response = api_client.post(
        f"/admin/projects/{project_id}/payments",
        json={
            "amount": 1000,
            "paymentDate": "2026-01-10",
            "method": "Bank transfer",
            "currency": "USD",
            "bankAccountId": account["id"],
            "pkrEquivalent": 279000,
        },
        headers=executive_headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["currency"] == "GBP"
    assert "currency" not in body["payments"][0]
    assert body["payments"][0]["bankAccountId"] == account["id"]


def test_project_payment_rejects_mismatched_bank_currency(
    api_client: TestClient, executive_headers: dict[str, str]
) -> None:
    created = api_client.post(
        "/admin/projects", json=_project_payload(currency="USD"), headers=executive_headers
    )
    project_id = created.json()["id"]
    account = api_client.post(
        "/admin/finance/bank-accounts",
        json=_bank_account_payload(currency="PKR"),
        headers=executive_headers,
    ).json()

    response = api_client.post(
        f"/admin/projects/{project_id}/payments",
        json={
            "amount": 1000,
            "paymentDate": "2026-01-10",
            "method": "Bank transfer",
            "bankAccountId": account["id"],
        },
        headers=executive_headers,
    )
    assert response.status_code == 422


def test_project_currency_immutable_after_payment_via_api(
    api_client: TestClient, executive_headers: dict[str, str]
) -> None:
    created = api_client.post(
        "/admin/projects", json=_project_payload(), headers=executive_headers
    )
    project_id = created.json()["id"]
    account = api_client.post(
        "/admin/finance/bank-accounts",
        json=_bank_account_payload(currency="GBP"),
        headers=executive_headers,
    ).json()
    api_client.post(
        f"/admin/projects/{project_id}/payments",
        json={
            "amount": 1000,
            "paymentDate": "2026-01-10",
            "method": "Bank transfer",
            "bankAccountId": account["id"],
            "pkrEquivalent": 279000,
        },
        headers=executive_headers,
    )

    response = api_client.put(
        f"/admin/projects/{project_id}",
        json=_project_payload(currency="USD"),
        headers=executive_headers,
    )
    assert response.status_code == 422


def _bank_account_payload(**overrides) -> dict:
    payload = {
        "name": f"Meezan PKR {date.today().isoformat()}",
        "bankName": "Meezan Bank",
        "currency": "PKR",
        "openingBalance": 50000000,
    }
    payload.update(overrides)
    if payload["currency"] != "PKR" and "openingBalancePkr" not in payload:
        payload["openingBalancePkr"] = payload["openingBalance"]
    return payload


def test_create_bank_account_requires_currency(
    api_client: TestClient, executive_headers: dict[str, str]
) -> None:
    payload = _bank_account_payload()
    del payload["currency"]
    response = api_client.post(
        "/admin/finance/bank-accounts", json=payload, headers=executive_headers
    )
    assert response.status_code == 422


def test_create_bank_account_rejects_invalid_currency(
    api_client: TestClient, executive_headers: dict[str, str]
) -> None:
    response = api_client.post(
        "/admin/finance/bank-accounts",
        json=_bank_account_payload(currency="XYZ"),
        headers=executive_headers,
    )
    assert response.status_code == 422


def test_create_bank_account_returns_balance_equal_to_opening_balance(
    api_client: TestClient, executive_headers: dict[str, str]
) -> None:
    response = api_client.post(
        "/admin/finance/bank-accounts",
        json=_bank_account_payload(openingBalance=100000),
        headers=executive_headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["balance"] == 100000
    assert body["isActive"] is True
    assert body["transactions"] == []


def test_list_bank_accounts_returns_created_account(
    api_client: TestClient, executive_headers: dict[str, str]
) -> None:
    created = api_client.post(
        "/admin/finance/bank-accounts",
        json=_bank_account_payload(name="Wise EUR", currency="EUR"),
        headers=executive_headers,
    )
    account_id = created.json()["id"]

    response = api_client.get("/admin/finance/bank-accounts", headers=executive_headers)
    assert response.status_code == 200
    assert any(row["id"] == account_id for row in response.json())


def test_add_bank_credit_increases_account_balance(
    api_client: TestClient, executive_headers: dict[str, str]
) -> None:
    created = api_client.post(
        "/admin/finance/bank-accounts",
        json=_bank_account_payload(openingBalance=0),
        headers=executive_headers,
    )
    account_id = created.json()["id"]

    response = api_client.post(
        f"/admin/finance/bank-accounts/{account_id}/credit",
        json={"date": "2026-01-10", "amount": 500000, "description": "Client invoice"},
        headers=executive_headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["balance"] == 500000
    assert len(body["transactions"]) == 1
    assert body["transactions"][0]["transactionType"] == "CREDIT"
    assert body["transactions"][0]["pkrEquivalent"] == 500000


def test_add_bank_debit_decreases_account_balance(
    api_client: TestClient, executive_headers: dict[str, str]
) -> None:
    created = api_client.post(
        "/admin/finance/bank-accounts",
        json=_bank_account_payload(openingBalance=1000000),
        headers=executive_headers,
    )
    account_id = created.json()["id"]

    response = api_client.post(
        f"/admin/finance/bank-accounts/{account_id}/debit",
        json={"date": "2026-01-10", "amount": 300000, "description": "Vendor bill"},
        headers=executive_headers,
    )
    assert response.status_code == 201
    assert response.json()["balance"] == 700000


def test_add_bank_credit_requires_pkr_equivalent_for_non_pkr_account(
    api_client: TestClient, executive_headers: dict[str, str]
) -> None:
    created = api_client.post(
        "/admin/finance/bank-accounts",
        json=_bank_account_payload(name="Deel USD", currency="USD", openingBalance=0),
        headers=executive_headers,
    )
    account_id = created.json()["id"]

    response = api_client.post(
        f"/admin/finance/bank-accounts/{account_id}/credit",
        json={"date": "2026-01-10", "amount": 100000, "description": "Payout"},
        headers=executive_headers,
    )
    assert response.status_code == 422


def test_bank_transfer_same_currency_updates_both_accounts(
    api_client: TestClient, executive_headers: dict[str, str]
) -> None:
    source = api_client.post(
        "/admin/finance/bank-accounts",
        json=_bank_account_payload(name="Source PKR", openingBalance=1000000),
        headers=executive_headers,
    ).json()
    destination = api_client.post(
        "/admin/finance/bank-accounts",
        json=_bank_account_payload(name="Destination PKR", openingBalance=0),
        headers=executive_headers,
    ).json()

    response = api_client.post(
        "/admin/finance/bank-transfers",
        json={
            "sourceAccountId": source["id"],
            "destinationAccountId": destination["id"],
            "sourceAmount": 400000,
            "destinationAmount": 400000,
            "date": "2026-01-10",
            "description": "Move operating funds",
        },
        headers=executive_headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["sourceAccount"]["balance"] == 600000
    assert body["destinationAccount"]["balance"] == 400000


def test_bank_transfer_rejects_same_account(
    api_client: TestClient, executive_headers: dict[str, str]
) -> None:
    account = api_client.post(
        "/admin/finance/bank-accounts",
        json=_bank_account_payload(openingBalance=1000000),
        headers=executive_headers,
    ).json()

    response = api_client.post(
        "/admin/finance/bank-transfers",
        json={
            "sourceAccountId": account["id"],
            "destinationAccountId": account["id"],
            "sourceAmount": 400000,
            "destinationAmount": 400000,
            "date": "2026-01-10",
            "description": "Self transfer",
        },
        headers=executive_headers,
    )
    assert response.status_code == 422


def test_bank_transfer_cross_currency_uses_pkr_leg_for_equivalent(
    api_client: TestClient, executive_headers: dict[str, str]
) -> None:
    source = api_client.post(
        "/admin/finance/bank-accounts",
        json=_bank_account_payload(name="Deel USD", currency="USD", openingBalance=500000),
        headers=executive_headers,
    ).json()
    destination = api_client.post(
        "/admin/finance/bank-accounts",
        json=_bank_account_payload(name="Meezan PKR", currency="PKR", openingBalance=0),
        headers=executive_headers,
    ).json()

    response = api_client.post(
        "/admin/finance/bank-transfers",
        json={
            "sourceAccountId": source["id"],
            "destinationAccountId": destination["id"],
            "sourceAmount": 100000,
            "destinationAmount": 27900000,
            "date": "2026-01-10",
            "description": "Deel payout to PKR account",
        },
        headers=executive_headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["sourceAccount"]["balance"] == 400000
    assert body["destinationAccount"]["balance"] == 27900000
    source_leg = body["sourceAccount"]["transactions"][0]
    assert source_leg["pkrEquivalent"] == 27900000
    assert source_leg["isTransfer"] is True
    assert source_leg["counterpartyAccountName"] == "Meezan PKR"


def _expense_payload(**overrides) -> dict:
    payload = {
        "title": "AWS bill",
        "category": "Infrastructure",
        "amount": 10000,
        "expenseType": "ONE_TIME",
        "date": "2026-01-10",
    }
    payload.update(overrides)
    return payload


def test_create_expense_requires_bank_account(
    api_client: TestClient, executive_headers: dict[str, str]
) -> None:
    response = api_client.post(
        "/admin/finance/expenses", json=_expense_payload(), headers=executive_headers
    )
    assert response.status_code == 422


def test_create_expense_creates_linked_bank_debit(
    api_client: TestClient, executive_headers: dict[str, str]
) -> None:
    account = api_client.post(
        "/admin/finance/bank-accounts",
        json=_bank_account_payload(openingBalance=100000),
        headers=executive_headers,
    ).json()

    response = api_client.post(
        "/admin/finance/expenses",
        json=_expense_payload(bankAccountId=account["id"]),
        headers=executive_headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["bankAccountId"] == account["id"]
    assert body["bankTransactionId"] is not None

    updated_account = api_client.get(
        f"/admin/finance/bank-accounts/{account['id']}", headers=executive_headers
    ).json()
    assert updated_account["balance"] == 90000


def test_delete_expense_removes_linked_bank_debit(
    api_client: TestClient, executive_headers: dict[str, str]
) -> None:
    account = api_client.post(
        "/admin/finance/bank-accounts",
        json=_bank_account_payload(openingBalance=100000),
        headers=executive_headers,
    ).json()
    expense = api_client.post(
        "/admin/finance/expenses",
        json=_expense_payload(bankAccountId=account["id"]),
        headers=executive_headers,
    ).json()

    response = api_client.delete(
        f"/admin/finance/expenses/{expense['id']}", headers=executive_headers
    )
    assert response.status_code == 204

    updated_account = api_client.get(
        f"/admin/finance/bank-accounts/{account['id']}", headers=executive_headers
    ).json()
    assert updated_account["balance"] == 100000
    assert updated_account["transactions"] == []


def test_finance_overview_reconciles_to_zero(
    api_client: TestClient, executive_headers: dict[str, str]
) -> None:
    account = api_client.post(
        "/admin/finance/bank-accounts",
        json=_bank_account_payload(openingBalance=0),
        headers=executive_headers,
    ).json()
    project = api_client.post(
        "/admin/projects", json=_project_payload(currency="PKR"), headers=executive_headers
    ).json()
    api_client.post(
        f"/admin/projects/{project['id']}/payments",
        json={
            "amount": 200000,
            "paymentDate": "2026-01-10",
            "method": "Bank transfer",
            "bankAccountId": account["id"],
        },
        headers=executive_headers,
    )
    api_client.post(
        "/admin/finance/expenses",
        json=_expense_payload(amount=50000, bankAccountId=account["id"]),
        headers=executive_headers,
    )

    response = api_client.get("/admin/finance/overview", headers=executive_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["totalIncome"] == 200000
    assert body["totalExpenses"] == 50000
    assert body["bankBalance"] == 150000
    assert body["netPosition"] == 150000
    assert body["unreconciledAmount"] == 0


def test_finance_overview_opening_balance_does_not_inflate_unreconciled(
    api_client: TestClient, executive_headers: dict[str, str]
) -> None:
    api_client.post(
        "/admin/finance/bank-accounts",
        json=_bank_account_payload(openingBalance=500000),
        headers=executive_headers,
    )

    response = api_client.get("/admin/finance/overview", headers=executive_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["bankBalance"] == 500000
    assert body["totalIncome"] == 0
    assert body["unreconciledAmount"] == 0


def test_create_expense_logs_activity_with_metadata(
    api_client: TestClient, executive_headers: dict[str, str], db_session: Session
) -> None:
    account = api_client.post(
        "/admin/finance/bank-accounts",
        json=_bank_account_payload(openingBalance=100000),
        headers=executive_headers,
    ).json()

    response = api_client.post(
        "/admin/finance/expenses",
        json=_expense_payload(bankAccountId=account["id"]),
        headers=executive_headers,
    )
    expense_id = response.json()["id"]

    log = db_session.scalar(
        select(ActivityLog)
        .where(ActivityLog.entity_type == "Expense", ActivityLog.entity_id == str(expense_id))
        .order_by(ActivityLog.id.desc())
    )
    assert log is not None
    assert log.action == "CREATE"
    assert log.performed_by_user_id is not None
    assert log.metadata_json == {"amount": 10000, "currency": "PKR"}


def test_expense_bank_transaction_has_expense_source_and_is_reconciled(
    api_client: TestClient, executive_headers: dict[str, str]
) -> None:
    account = api_client.post(
        "/admin/finance/bank-accounts",
        json=_bank_account_payload(openingBalance=100000),
        headers=executive_headers,
    ).json()
    api_client.post(
        "/admin/finance/expenses",
        json=_expense_payload(bankAccountId=account["id"]),
        headers=executive_headers,
    )

    updated_account = api_client.get(
        f"/admin/finance/bank-accounts/{account['id']}", headers=executive_headers
    ).json()
    transaction = updated_account["transactions"][0]
    assert transaction["source"] == "EXPENSE"
    assert transaction["isReconciled"] is True


def test_manual_bank_credit_has_manual_source_and_is_unreconciled(
    api_client: TestClient, executive_headers: dict[str, str]
) -> None:
    account = api_client.post(
        "/admin/finance/bank-accounts",
        json=_bank_account_payload(openingBalance=0),
        headers=executive_headers,
    ).json()
    api_client.post(
        f"/admin/finance/bank-accounts/{account['id']}/credit",
        json={"date": "2026-01-10", "amount": 500000, "description": "Client invoice"},
        headers=executive_headers,
    )

    updated_account = api_client.get(
        f"/admin/finance/bank-accounts/{account['id']}", headers=executive_headers
    ).json()
    transaction = updated_account["transactions"][0]
    assert transaction["source"] == "MANUAL"
    assert transaction["isReconciled"] is False


def test_bank_account_deactivate_logs_deactivate_action(
    api_client: TestClient, executive_headers: dict[str, str], db_session: Session
) -> None:
    account = api_client.post(
        "/admin/finance/bank-accounts",
        json=_bank_account_payload(),
        headers=executive_headers,
    ).json()

    api_client.put(
        f"/admin/finance/bank-accounts/{account['id']}",
        json={**_bank_account_payload(), "isActive": False},
        headers=executive_headers,
    )

    log = db_session.scalar(
        select(ActivityLog)
        .where(
            ActivityLog.entity_type == "BankAccount",
            ActivityLog.entity_id == str(account["id"]),
        )
        .order_by(ActivityLog.id.desc())
    )
    assert log is not None
    assert log.action == "DEACTIVATE"


def test_payroll_entry_out_includes_pkr_equivalent_when_paid_from_foreign_account(
    api_client: TestClient, executive_headers: dict[str, str]
) -> None:
    designation = api_client.post(
        "/admin/settings/designations", params={"name": "Engineer"}, headers=executive_headers
    ).json()
    employee = api_client.post(
        "/admin/employees",
        json={
            "firstName": "Jane",
            "lastName": "Doe",
            "email": f"jane-{date.today().isoformat()}@example.com",
            "phone": "03000000000",
            "employeeType": "EMPLOYEE",
            "status": "ACTIVE",
            "designationId": designation["id"],
            "joiningDate": "2025-01-01",
            "baseAmount": 100000,
            "currency": "PKR",
        },
        headers=executive_headers,
    ).json()
    account = api_client.post(
        "/admin/finance/bank-accounts",
        json=_bank_account_payload(name="Deel USD", currency="USD", openingBalance=500000),
        headers=executive_headers,
    ).json()
    entry = api_client.post(
        "/admin/finance/payroll",
        json={
            "employeeId": employee["id"],
            "month": "2026-01",
            "baseCompensation": 100000,
            "adjustment": 0,
            "currency": "PKR",
        },
        headers=executive_headers,
    ).json()

    response = api_client.patch(
        f"/admin/finance/payroll/{entry['id']}/pay",
        json={"bankAccountId": account["id"], "pkrEquivalent": 27900000},
        headers=executive_headers,
    )
    assert response.status_code == 200
    assert response.json()["pkrEquivalent"] == 27900000


def test_activity_endpoint_filters_by_entity_type(
    api_client: TestClient, executive_headers: dict[str, str]
) -> None:
    api_client.post(
        "/admin/finance/bank-accounts",
        json=_bank_account_payload(name=f"Activity Filter {date.today().isoformat()}"),
        headers=executive_headers,
    )

    response = api_client.get(
        "/admin/activity", params={"entity_type": "BankAccount"}, headers=executive_headers
    )
    assert response.status_code == 200
    body = response.json()
    assert body["total"] >= 1
    assert all(item["entityType"] == "BankAccount" for item in body["items"])
    assert body["items"][0]["performedByUserId"] is not None
    assert body["items"][0]["performedByName"]


def test_activity_endpoint_paginates(
    api_client: TestClient, executive_headers: dict[str, str]
) -> None:
    for index in range(3):
        api_client.post(
            "/admin/finance/bank-accounts",
            json=_bank_account_payload(name=f"Page Test {date.today().isoformat()} {index}"),
            headers=executive_headers,
        )

    response = api_client.get(
        "/admin/activity",
        params={"entity_type": "BankAccount", "page": 1, "page_size": 2},
        headers=executive_headers,
    )
    body = response.json()
    assert len(body["items"]) == 2
    assert body["page"] == 1
    assert body["pageSize"] == 2


def test_activity_endpoint_requires_authentication() -> None:
    client = TestClient(app)
    response = client.get("/admin/activity")
    assert response.status_code == 401
