from fastapi import APIRouter, Request, status

from app.dependencies import CurrentUser, DbSession
from app.schemas import AdminLoginIn, OtpRequestIn, OtpVerifyIn, ProfileUpdateIn, RefreshIn
from app.serializers import user_dict
from app.services.auth import admin_login, request_otp, revoke_refresh, rotate_refresh, verify_otp

router = APIRouter(prefix="/auth", tags=["authentication"])


def client_ip(request: Request) -> str | None:
    return request.client.host if request.client else None


def token_response(result: dict) -> dict:
    return {
        "access_token": result["access_token"],
        "refresh_token": result["refresh_token"],
        "token_type": result["token_type"],
        "expires_in": result["expires_in"],
        "user": user_dict(result["user"]),
    }


@router.post("/otp/request", status_code=status.HTTP_202_ACCEPTED)
def request_customer_otp(payload: OtpRequestIn, request: Request, db: DbSession):
    phone, development_code = request_otp(db, payload.phone, client_ip(request))
    response = {"phone": phone, "expires_in": 300, "message": "Verification code sent"}
    if development_code:
        response["development_code"] = development_code
    return response


@router.post("/otp/verify")
def verify_customer_otp(payload: OtpVerifyIn, request: Request, db: DbSession):
    result = verify_otp(
        db, payload.phone, payload.code, request.headers.get("user-agent"), client_ip(request)
    )
    return token_response(result)


@router.post("/admin/login")
def login_admin(payload: AdminLoginIn, request: Request, db: DbSession):
    result = admin_login(
        db,
        payload.email,
        payload.password,
        request.headers.get("user-agent"),
        client_ip(request),
    )
    return token_response(result)


@router.post("/refresh")
def refresh(payload: RefreshIn, request: Request, db: DbSession):
    result = rotate_refresh(
        db, payload.refresh_token, request.headers.get("user-agent"), client_ip(request)
    )
    return token_response(result)


@router.post("/logout", status_code=204)
def logout(payload: RefreshIn, db: DbSession):
    revoke_refresh(db, payload.refresh_token)
    return None


@router.get("/me")
def me(user: CurrentUser):
    return user_dict(user)


@router.patch("/me")
def update_me(payload: ProfileUpdateIn, user: CurrentUser, db: DbSession):
    values = payload.model_dump(exclude_unset=True)
    if "full_name" in values:
        user.profile.full_name = values.pop("full_name")
    for key, value in values.items():
        setattr(user.preferences, key, value)
    db.commit()
    return user_dict(user)


@router.post("/me/delete-request", status_code=202)
def request_account_deletion(user: CurrentUser, db: DbSession):
    from app.models import utcnow

    user.profile.delete_requested_at = utcnow()
    db.commit()
    return {"status": "requested"}
