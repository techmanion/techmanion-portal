from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Techmanion Portal API"
    api_prefix: str = "/api/v1"
    database_url: str
    jwt_secret: str = "development-only-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 480
    frontend_url: str = "http://localhost:5173"
    upload_dir: Path = Path("uploads")
    seed_user_email: str = "core@techmanion.com"
    seed_user_password: str = "ChangeMe123!"

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[1] / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("frontend_url")
    @classmethod
    def strip_trailing_slash(cls, value: str) -> str:
        return value.rstrip("/")


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
