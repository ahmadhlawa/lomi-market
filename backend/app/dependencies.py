from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.errors import ApiError
from app.models import User
from app.security import decode_access_token

bearer = HTTPBearer(auto_error=False)
DbSession = Annotated[Session, Depends(get_db)]


def get_current_user(
    db: DbSession,
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)],
) -> User:
    if not credentials:
        raise ApiError(401, "Authentication required", "not_authenticated")
    payload = decode_access_token(credentials.credentials)
    user = db.get(User, payload["sub"])
    if not user or not user.is_active or user.deleted_at:
        raise ApiError(401, "Account is not available", "account_unavailable")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_admin(user: CurrentUser) -> User:
    if user.role not in {"admin", "manager", "operator"}:
        raise ApiError(403, "Administrator permission required", "forbidden")
    return user


AdminUser = Annotated[User, Depends(require_admin)]


def require_permission(permission: str):
    def dependency(user: AdminUser) -> User:
        if user.role == "admin" or permission in (user.permissions or []):
            return user
        raise ApiError(403, f"Missing permission: {permission}", "forbidden")

    return dependency
