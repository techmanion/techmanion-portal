from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import Lead


def _lead_payload(**overrides) -> dict:
    payload = {
        "name": "Jordan Rivera",
        "email": "jordan@example.com",
        "company": "Acme Co",
        "goal": "Replace a manual intake process with something the team can run itself.",
        "audience": "FOUNDER",
    }
    payload.update(overrides)
    return payload


def test_submit_lead_is_public(api_client: TestClient, db_session: Session) -> None:
    response = api_client.post("/public/leads", json=_lead_payload())
    assert response.status_code == 201
    body = response.json()
    assert "id" in body

    lead = db_session.get(Lead, body["id"])
    assert lead is not None
    assert lead.name == "Jordan Rivera"
    assert lead.email == "jordan@example.com"
    assert lead.audience.value == "FOUNDER"
    assert lead.status.value == "NEW"


def test_submit_lead_requires_name_and_email(api_client: TestClient) -> None:
    response = api_client.post(
        "/public/leads", json=_lead_payload(name="", email="not-an-email")
    )
    assert response.status_code == 422


def test_submit_lead_rejects_invalid_audience(api_client: TestClient) -> None:
    response = api_client.post("/public/leads", json=_lead_payload(audience="OTHER"))
    assert response.status_code == 422


def test_submit_lead_allows_optional_company_and_goal(api_client: TestClient) -> None:
    response = api_client.post(
        "/public/leads",
        json=_lead_payload(company=None, goal=None),
    )
    assert response.status_code == 201


def test_list_leads_requires_authentication(api_client: TestClient) -> None:
    response = api_client.get("/admin/leads")
    assert response.status_code == 401


def test_list_leads_returns_submitted_lead(
    api_client: TestClient, executive_headers: dict[str, str]
) -> None:
    create = api_client.post("/public/leads", json=_lead_payload(audience="BUSINESS"))
    assert create.status_code == 201

    response = api_client.get("/admin/leads", headers=executive_headers)
    assert response.status_code == 200
    emails = [row["email"] for row in response.json()]
    assert "jordan@example.com" in emails


def test_list_leads_filters_by_status(
    api_client: TestClient, executive_headers: dict[str, str]
) -> None:
    api_client.post("/public/leads", json=_lead_payload())
    response = api_client.get(
        "/admin/leads", params={"status": "ARCHIVED"}, headers=executive_headers
    )
    assert response.status_code == 200
    assert response.json() == []


def test_update_lead_status(
    api_client: TestClient, executive_headers: dict[str, str]
) -> None:
    create = api_client.post("/public/leads", json=_lead_payload())
    lead_id = create.json()["id"]

    response = api_client.patch(
        f"/admin/leads/{lead_id}/status",
        json={"status": "CONTACTED"},
        headers=executive_headers,
    )
    assert response.status_code == 200
    assert response.json()["status"] == "CONTACTED"


def test_get_unknown_lead_returns_404(
    api_client: TestClient, executive_headers: dict[str, str]
) -> None:
    response = api_client.get("/admin/leads/999999", headers=executive_headers)
    assert response.status_code == 404
