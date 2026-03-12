from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://lingualeap:lingualeap@localhost:5432/lingualeap"

    # Redis (leave empty to run without Redis)
    REDIS_URL: str = ""

    # JWT
    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # S3
    S3_BUCKET_NAME: str = "lingualeap-content"
    S3_REGION: str = "us-east-1"
    S3_ACCESS_KEY_ID: str = ""
    S3_SECRET_ACCESS_KEY: str = ""

    # OAuth
    GOOGLE_OAUTH_CLIENT_ID: str = ""
    GOOGLE_OAUTH_CLIENT_SECRET: str = ""
    APPLE_OAUTH_CLIENT_ID: str = ""

    # Content
    CONTENT_DIR: str = "../content"

    # Video
    VIDEO_BACKEND: str = "local"
    VIDEO_LOCAL_DIR: str = "content/videos"
    MUX_TOKEN_ID: str = ""
    MUX_TOKEN_SECRET: str = ""
    MUX_WEBHOOK_SECRET: str = ""

    # App
    APP_ENV: str = "development"
    DEBUG: bool = True


settings = Settings()
