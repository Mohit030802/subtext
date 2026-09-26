from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # ── Database ──────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://postgres:1234@localhost:5432/subtext_db_local"
    SYNC_DATABASE_URL: str = "postgresql+psycopg://postgres:1234@localhost:5432/subtext_db_local"

    # ── Redis ─────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"

    # ── Google AI ─────────────────────────────────────────────
    GOOGLE_API_KEY: str = ""

    # ── Google OAuth ──────────────────────────────────────────
    GOOGLE_CLIENT_ID: str = "939932315590-9uie0b5787k7v5l3qfhlakfvotugee1h.apps.googleusercontent.com"
    GOOGLE_CLIENT_SECRET: str = ""
    AUTH_SECRET: str = ""

    # ── App ───────────────────────────────────────────────────
    APP_SECRET_KEY: str = "change-this-to-a-random-string"
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 50

    # ── CORS ──────────────────────────────────────────────────
    FRONTEND_URL: str = "http://localhost:3000"

    model_config = {"env_file": ".env", "extra": "ignore"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
