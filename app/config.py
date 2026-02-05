from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

BASE_DIR = Path(__file__).resolve().parents[1]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    
    ENV: str = Field(default="development")

    DB_URL: str

   
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

   
    FRONTEND_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

   
    FRONTEND_BASE_URL: str = Field(default="http://localhost:5173")

   
    BOOTSTRAP_ADMIN_ENABLED: bool = False

    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.FRONTEND_ORIGINS.split(",") if o.strip()]

    @property
    def frontend_base_url(self) -> str:
        return self.FRONTEND_BASE_URL


settings = Settings()
