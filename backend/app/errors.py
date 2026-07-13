from typing import Any


class ApiError(Exception):
    def __init__(
        self,
        status_code: int,
        detail: str,
        code: str,
        field_errors: dict[str, Any] | None = None,
    ) -> None:
        self.status_code = status_code
        self.detail = detail
        self.code = code
        self.field_errors = field_errors
        super().__init__(detail)

