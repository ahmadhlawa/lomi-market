import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

TEST_DB = Path(__file__).parent / "test.db"
os.environ.update(
    {
        "LOMI_ENV": "test",
        "LOMI_DATABASE_URL": f"sqlite:///{TEST_DB.as_posix()}",
        "LOMI_SECRET_KEY": "test-secret-key-that-is-long-enough-for-jwt",
        "LOMI_DEV_OTP": "123456",
        "LOMI_ADMIN_EMAIL": "admin@lomi.ps",
        "LOMI_ADMIN_PASSWORD": "ChangeMe123!",
        "LOMI_UPLOAD_DIR": str(Path(__file__).parent / "uploads"),
    }
)

from app.database import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.seed import seed_database  # noqa: E402


@pytest.fixture(autouse=True)
def reset_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as session:
        seed_database(session)
    yield


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture
def customer_auth(client):
    requested = client.post("/api/v1/auth/otp/request", json={"phone": "0599123456"})
    assert requested.status_code == 202
    verified = client.post(
        "/api/v1/auth/otp/verify", json={"phone": "0599123456", "code": "123456"}
    )
    assert verified.status_code == 200
    return verified.json()


@pytest.fixture
def customer_headers(customer_auth):
    return {"Authorization": f"Bearer {customer_auth['access_token']}"}


@pytest.fixture
def admin_headers(client):
    response = client.post(
        "/api/v1/auth/admin/login",
        json={"email": "admin@lomi.ps", "password": "ChangeMe123!"},
    )
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}

