import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import desc, func, select, update
from sqlalchemy.orm import Session

from app.config import settings
from app.errors import ApiError
from app.models import (
    AuthAttempt,
    CustomerPreference,
    CustomerProfile,
    OtpRequest,
    RefreshToken,
    User,
)
from app.security import (
    create_access_token,
    create_refresh_secret,
    hash_value,
    normalize_phone,
    verify_password,
    verify_value,
)


def aware(value: datetime) -> datetime:
    return value if value.tzinfo else value.replace(tzinfo=UTC)


def request_otp(db: Session, raw_phone: str, ip_address: str | None) -> tuple[str, str | None]:
    phone = normalize_phone(raw_phone)
    now = datetime.now(UTC)
    recent = db.scalar(
        select(func.count(OtpRequest.id)).where(
            OtpRequest.phone == phone,
            OtpRequest.created_at >= now - timedelta(minutes=10),
        )
    )
    if recent and recent >= 5:
        raise ApiError(429, "Too many OTP requests. Try again later.", "otp_rate_limited")
    code = settings.dev_otp if settings.otp_provider == "development" else f"{uuid.uuid4().int % 1_000_000:06d}"
    db.add(
        OtpRequest(
            phone=phone,
            code_hash=hash_value(code),
            expires_at=now + timedelta(seconds=settings.otp_ttl_seconds),
            request_ip=ip_address,
        )
    )
    db.commit()
    development_code = code if settings.env in {"development", "test"} else None
    return phone, development_code


def verify_otp(db: Session, raw_phone: str, code: str, user_agent: str | None, ip: str | None) -> dict:
    phone = normalize_phone(raw_phone)
    otp = db.scalar(
        select(OtpRequest)
        .where(OtpRequest.phone == phone, OtpRequest.consumed_at.is_(None))
        .order_by(desc(OtpRequest.created_at))
    )
    now = datetime.now(UTC)
    if not otp or aware(otp.expires_at) <= now or otp.attempts >= 5 or not verify_value(code, otp.code_hash):
        if otp:
            otp.attempts += 1
            db.commit()
        raise ApiError(400, "The verification code is invalid or expired", "otp_invalid")
    otp.consumed_at = now
    user = db.scalar(select(User).where(User.phone == phone))
    if not user:
        user = User(phone=phone, role="customer")
        user.profile = CustomerProfile(full_name="Lomi Customer")
        user.preferences = CustomerPreference(language="en")
        db.add(user)
        db.flush()
    if not user.is_active:
        raise ApiError(403, "Account is disabled", "account_disabled")
    user.last_login_at = now
    result = issue_tokens(db, user, user_agent, ip)
    db.commit()
    return result


def issue_tokens(db: Session, user: User, user_agent: str | None, ip: str | None, family_id: str | None = None) -> dict:
    raw_refresh = create_refresh_secret()
    token = RefreshToken(
        user_id=user.id,
        token_hash=hash_value(raw_refresh),
        family_id=family_id or str(uuid.uuid4()),
        expires_at=datetime.now(UTC) + timedelta(days=settings.refresh_token_days),
        user_agent=user_agent,
        ip_address=ip,
    )
    db.add(token)
    db.flush()
    return {
        "access_token": create_access_token(user.id, user.role, user.permissions or []),
        "refresh_token": raw_refresh,
        "token_type": "bearer",
        "expires_in": settings.access_token_minutes * 60,
        "user": user,
        "refresh_record": token,
    }


def rotate_refresh(db: Session, raw_token: str, user_agent: str | None, ip: str | None) -> dict:
    digest = hash_value(raw_token)
    record = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == digest))
    now = datetime.now(UTC)
    if not record or record.revoked_at or aware(record.expires_at) <= now:
        if record:
            db.execute(
                update(RefreshToken)
                .where(RefreshToken.family_id == record.family_id, RefreshToken.revoked_at.is_(None))
                .values(revoked_at=now)
            )
            db.commit()
        raise ApiError(401, "Refresh token is invalid or expired", "invalid_refresh_token")
    user = db.get(User, record.user_id)
    if not user or not user.is_active:
        raise ApiError(401, "Account is not available", "account_unavailable")
    record.revoked_at = now
    result = issue_tokens(db, user, user_agent, ip, record.family_id)
    record.replaced_by_id = result["refresh_record"].id
    db.commit()
    return result


def revoke_refresh(db: Session, raw_token: str) -> None:
    record = db.scalar(select(RefreshToken).where(RefreshToken.token_hash == hash_value(raw_token)))
    if record and not record.revoked_at:
        record.revoked_at = datetime.now(UTC)
        db.commit()


def admin_login(db: Session, email: str, password: str, user_agent: str | None, ip: str | None) -> dict:
    now = datetime.now(UTC)
    attempt_key = hash_value(f"admin:{email.lower()}:{ip or 'unknown'}")
    attempt = db.scalar(select(AuthAttempt).where(AuthAttempt.key_hash == attempt_key))
    if attempt and attempt.locked_until and aware(attempt.locked_until) > now:
        raise ApiError(429, "Too many login attempts. Try again later.", "login_rate_limited")
    if attempt and aware(attempt.window_started_at) < now - timedelta(minutes=15):
        attempt.attempts = 0
        attempt.window_started_at = now
        attempt.locked_until = None
    user = db.scalar(select(User).where(func.lower(User.email) == email.lower()))
    if not user or not user.password_hash or user.role not in {"admin", "manager", "operator"}:
        if not attempt:
            attempt = AuthAttempt(key_hash=attempt_key, attempts=0, window_started_at=now)
            db.add(attempt)
        attempt.attempts += 1
        if attempt.attempts >= 5:
            attempt.locked_until = now + timedelta(minutes=15)
        db.commit()
        raise ApiError(401, "Invalid email or password", "invalid_credentials")
    if not verify_password(password, user.password_hash):
        if not attempt:
            attempt = AuthAttempt(key_hash=attempt_key, attempts=0, window_started_at=now)
            db.add(attempt)
        attempt.attempts += 1
        if attempt.attempts >= 5:
            attempt.locked_until = now + timedelta(minutes=15)
        db.commit()
        raise ApiError(401, "Invalid email or password", "invalid_credentials")
    if not user.is_active:
        raise ApiError(403, "Account is disabled", "account_disabled")
    if attempt:
        db.delete(attempt)
    user.last_login_at = now
    result = issue_tokens(db, user, user_agent, ip)
    db.commit()
    return result
