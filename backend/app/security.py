import hashlib
import hmac
import re
import secrets
from datetime import UTC, datetime, timedelta

import jwt
from pwdlib import PasswordHash

from app.config import settings
from app.errors import ApiError

password_hash = PasswordHash.recommended()


def normalize_phone(value: str) -> str:
    digits = re.sub(r"\D", "", value)
    if digits.startswith("00970"):
        digits = digits[5:]
    elif digits.startswith("970"):
        digits = digits[3:]
    elif digits.startswith("0"):
        digits = digits[1:]
    if not re.fullmatch(r"(?:56|59)\d{7}", digits):
        raise ApiError(422, "Enter a valid Palestinian mobile number", "invalid_phone")
    return f"+970{digits}"


def hash_value(value: str) -> str:
    return hmac.new(settings.secret_key.encode(), value.encode(), hashlib.sha256).hexdigest()


def verify_value(value: str, digest: str) -> bool:
    return hmac.compare_digest(hash_value(value), digest)


def create_access_token(user_id: str, role: str, permissions: list[str]) -> str:
    now = datetime.now(UTC)
    payload = {
        "sub": user_id,
        "role": role,
        "permissions": permissions,
        "type": "access",
        "jti": secrets.token_hex(16),
        "iat": now,
        "exp": now + timedelta(minutes=settings.access_token_minutes),
    }
    return jwt.encode(payload, settings.secret_key, algorithm="HS256")


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
    except jwt.PyJWTError as exc:
        raise ApiError(401, "Invalid or expired access token", "invalid_token") from exc
    if payload.get("type") != "access" or not payload.get("sub"):
        raise ApiError(401, "Invalid access token", "invalid_token")
    return payload


def create_refresh_secret() -> str:
    return secrets.token_urlsafe(48)


def hash_password(value: str) -> str:
    return password_hash.hash(value)


def verify_password(value: str, digest: str) -> bool:
    return password_hash.verify(value, digest)

