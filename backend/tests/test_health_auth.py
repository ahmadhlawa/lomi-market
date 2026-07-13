def test_health_and_readiness(client):
    assert client.get("/health").json() == {"status": "ok"}
    ready = client.get("/ready")
    assert ready.status_code == 200
    assert ready.json()["database"] == "ok"


def test_otp_is_single_use_and_phone_is_normalized(client):
    response = client.post("/api/v1/auth/otp/request", json={"phone": "+970 599 123 456"})
    assert response.status_code == 202
    assert response.json()["phone"] == "+970599123456"
    assert response.json()["development_code"] == "123456"

    verified = client.post(
        "/api/v1/auth/otp/verify", json={"phone": "0599123456", "code": "123456"}
    )
    assert verified.status_code == 200
    assert verified.json()["token_type"] == "bearer"

    replay = client.post(
        "/api/v1/auth/otp/verify", json={"phone": "0599123456", "code": "123456"}
    )
    assert replay.status_code == 400
    assert replay.json()["code"] == "otp_invalid"


def test_refresh_rotation_revokes_previous_token(client, customer_auth):
    first = customer_auth["refresh_token"]
    rotated = client.post("/api/v1/auth/refresh", json={"refresh_token": first})
    assert rotated.status_code == 200
    assert rotated.json()["refresh_token"] != first
    assert client.post("/api/v1/auth/refresh", json={"refresh_token": first}).status_code == 401


def test_customer_cannot_access_admin(client, customer_headers):
    response = client.get("/api/v1/admin/dashboard", headers=customer_headers)
    assert response.status_code == 403
    assert response.json()["code"] == "forbidden"


def test_admin_login_is_locked_after_repeated_failures(client):
    for _ in range(5):
        response = client.post(
            "/api/v1/auth/admin/login",
            json={"email": "admin@lomi.ps", "password": "WrongPassword1!"},
        )
        assert response.status_code == 401
    locked = client.post(
        "/api/v1/auth/admin/login",
        json={"email": "admin@lomi.ps", "password": "ChangeMe123!"},
    )
    assert locked.status_code == 429
    assert locked.json()["code"] == "login_rate_limited"
