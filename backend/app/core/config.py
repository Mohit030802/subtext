from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://subtext:subtext_dev_2024@localhost:5432/subtext"
    SYNC_DATABASE_URL: str = "postgresql+psycopg://subtext:subtext_dev_2024@localhost:5432/subtext"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # AI - Google Gemini
    GOOGLE_API_KEY: str = ""

    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    # App
    APP_SECRET_KEY: str = "change-this-to-a-random-string"
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 50

    # CORS
    FRONTEND_URL: str = "http://localhost:3000"

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
