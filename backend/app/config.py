from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="LOMI_", env_file=".env", extra="ignore")

    env: str = "development"
    database_url: str = "sqlite:///./lomi.db"
    secret_key: str = Field("development-secret-change-me-32-characters", min_length=32)
    access_token_minutes: int = Field(15, ge=5, le=60)
    refresh_token_days: int = Field(30, ge=1, le=90)
    otp_ttl_seconds: int = Field(300, ge=60, le=900)
    otp_provider: str = "development"
    dev_otp: str = Field("123456", pattern=r"^\d{6}$")
    cors_origins: str = "http://localhost:5173,http://localhost:8081"
    public_base_url: str = "http://localhost:8000"
    upload_dir: Path = Path("uploads")
    max_upload_bytes: int = Field(5 * 1024 * 1024, ge=1024, le=20 * 1024 * 1024)
    admin_email: str = "admin@lomi.ps"
    admin_password: str = Field("ChangeMe123!", min_length=10)

    @field_validator("env")
    @classmethod
    def validate_env(cls, value: str) -> str:
        allowed = {"development", "test", "staging", "production"}
        if value not in allowed:
            raise ValueError(f"env must be one of {sorted(allowed)}")
        return value

    @property
    def cors_origin_list(self) -> list[str]:
        return [value.strip() for value in self.cors_origins.split(",") if value.strip()]

    @property
    def is_production(self) -> bool:
        return self.env == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

