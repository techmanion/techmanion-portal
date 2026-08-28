from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Techmanion Portal API"
    database_url: str
    jwt_secret: str = "development-only-secret-change-me"
    jwt_algorithm: str = "HS256"
    access_token_minutes: int = 480
    # Comma-separated list of allowed CORS origins, e.g. one per frontend deployment.
    frontend_urls: str = "http://localhost:5173,http://localhost:3000"
    upload_dir: Path = Path("uploads")

    s3_bucket_name: str = ""
    s3_region: str = "us-east-1"
    s3_public_base_url: str = ""
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""

    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[1] / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def frontend_url_list(self) -> list[str]:
        return [url.strip().rstrip("/") for url in self.frontend_urls.split(",") if url.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
