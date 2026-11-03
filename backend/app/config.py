"""Application configuration using pydantic-settings."""

from __future__ import annotations

import os
from pathlib import Path

from pydantic_settings import BaseSettings

# Resolve paths relative to the backend/ directory
BASE_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """Application-wide settings loaded from environment / .env file."""

    # Server
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000

    # Database
    database_url: str = f"sqlite:///{BASE_DIR / 'fraud_detection.db'}"

    # ML Model
    model_path: str = str(BASE_DIR / "artifacts" / "fraud_model.joblib")
    model_version: str = "1.0.0"

    # Risk thresholds (configurable)
    risk_low_max: int = 29
    risk_medium_max: int = 69

    # CORS
    cors_origins: str = "http://localhost:5173"

    model_config = {
        "env_file": str(BASE_DIR / ".env"),
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]


settings = Settings()

