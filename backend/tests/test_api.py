from fastapi.testclient import TestClient

from app.main import app


def test_health() -> None:
    client = TestClient(app)
    health = client.get("/health")
    assert health.status_code == 200
    assert health.json() == {"status": "ok"}


def test_protected_resource_rejects_anonymous_request() -> None:
    client = TestClient(app)
    response = client.get("/api/v1/admin/employees")
    assert response.status_code == 401
