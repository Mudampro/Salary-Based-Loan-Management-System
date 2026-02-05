# app/config.py

from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

BASE_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    """
    Settings loader:
    - Locally: reads from .env (if present)
    - On Render: reads from Render Environment Variables (since .env is not present)
    """

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),  
        env_file_encoding="utf-8",
        extra="ignore",
    )

   
    ENV: str = Field(default="development")

    
    DB_URL: str = Field(default="")

    
    SECRET_KEY: str = Field(default="")
    ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30)

    
    FRONTEND_ORIGINS: str = Field(default="http://localhost:5173,http://127.0.0.1:5173")
    FRONTEND_BASE_URL: str = Field(default="http://localhost:5173")

    
    BOOTSTRAP_ADMIN_ENABLED: bool = Field(default=False)

    
    RESET_TOKEN_EXPIRE_MINUTES: int = Field(default=30)
    FRONTEND_RESET_URL: str = Field(default="http://localhost:5173/reset-password")

    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.FRONTEND_ORIGINS.split(",") if o.strip()]

    @property
    def frontend_base_url(self) -> str:
        return self.FRONTEND_BASE_URL


settings = Settings()


if settings.ENV == "production":
    if not settings.DB_URL:
        raise ValueError("DB_URL is missing. Set DB_URL in Render environment variables.")
    if not settings.SECRET_KEY:
        raise ValueError("SECRET_KEY is missing. Set SECRET_KEY in Render environment variables.")
