import os
import uuid

os.environ["DATABASE_URL"] = os.environ.get(
    "TEST_DATABASE_URL",
    "postgresql+psycopg://test:test@localhost:5432/techmanion_test",
)

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.database import engine, get_db
from app.main import app
from app.models import EmployeeType, User
from app.security import create_access_token, hash_password


@pytest.fixture()
def db_session() -> Session:
    connection = engine.connect()
    transaction = connection.begin()
    session = Session(bind=connection, join_transaction_mode="create_savepoint")
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture()
def api_client(db_session: Session) -> TestClient:
    def _get_db_override():
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.fixture()
def executive_headers(db_session: Session) -> dict[str, str]:
    user = User(
        email=f"exec-{uuid.uuid4().hex[:10]}@example.com",
        password_hash=hash_password("password123"),
        name="Test Executive",
        role=EmployeeType.EXECUTIVE,
    )
    db_session.add(user)
    db_session.flush()
    token = create_access_token(user.id)
    return {"Authorization": f"Bearer {token}"}
