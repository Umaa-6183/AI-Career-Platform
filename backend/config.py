"""
CareerIQ Pro - Application Configuration
Centralized settings management using Pydantic BaseSettings
"""

from pydantic_settings import BaseSettings
from typing import List, Optional
import os


class Settings(BaseSettings):
    # ── App ────────────────────────────────────────────────────────────────────
    APP_NAME: str = "CareerIQ Pro"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # ── API ────────────────────────────────────────────────────────────────────
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))
    API_PREFIX: str = "/api"
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ]

    # ── Database ───────────────────────────────────────────────────────────────
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", "postgresql://careeriq:careeriq_pass@localhost:5432/careeriq_db"
    )
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_ECHO: bool = False

    # ── Auth / JWT ─────────────────────────────────────────────────────────────
    SECRET_KEY: str = os.getenv("SECRET_KEY", "careeriq-dev-secret-change-in-production-abc123")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7   # 7 days
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # ── ML Engine ──────────────────────────────────────────────────────────────
    SALARY_MODEL_PATH: Optional[str] = os.getenv("SALARY_MODEL_PATH", None)
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    NLP_MODEL: str = os.getenv("NLP_MODEL", "en_core_web_sm")
    ML_BATCH_SIZE: int = 32
    SALARY_CONFIDENCE_THRESHOLD: float = 0.65

    # ── Privacy & Anonymization ────────────────────────────────────────────────
    PII_REMOVAL_ENABLED: bool = True
    ENCRYPT_RESUME_STORAGE: bool = True
    DATA_RETENTION_DAYS: int = 365
    ANONYMIZATION_SALT: str = os.getenv("ANONYMIZATION_SALT", "careeriq-anon-salt-2024")

    # ── External APIs ──────────────────────────────────────────────────────────
    ADZUNA_APP_ID: Optional[str] = os.getenv("ADZUNA_APP_ID")
    ADZUNA_API_KEY: Optional[str] = os.getenv("ADZUNA_API_KEY")
    JSEARCH_API_KEY: Optional[str] = os.getenv("JSEARCH_API_KEY")
    GITHUB_TOKEN: Optional[str] = os.getenv("GITHUB_TOKEN")

    # ── Caching (Redis) ────────────────────────────────────────────────────────
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    CACHE_TTL_SECONDS: int = 3600  # 1 hour

    # ── File Upload ────────────────────────────────────────────────────────────
    MAX_UPLOAD_SIZE_MB: int = 10
    ALLOWED_FILE_TYPES: List[str] = ["application/pdf", "text/plain",
                                      "application/msword",
                                      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]

    # ── Salary Normalization ───────────────────────────────────────────────────
    SALARY_LEVELS: dict = {
        "L1": {"range": [30000, 50000],   "label": "Entry Level"},
        "L2": {"range": [50000, 70000],   "label": "Junior"},
        "L3": {"range": [70000, 90000],   "label": "Mid-Level"},
        "L4": {"range": [90000, 120000],  "label": "Senior"},
        "L5": {"range": [120000, 160000], "label": "Staff / Lead"},
        "L6": {"range": [160000, 200000], "label": "Principal"},
        "L7": {"range": [200000, 260000], "label": "Distinguished"},
        "L8": {"range": [260000, 340000], "label": "Fellow"},
        "L9": {"range": [340000, 450000], "label": "Senior Fellow"},
        "L10": {"range": [450000, 1000000], "label": "Executive / VP"},
    }

    # ── Weights for Similarity Scoring ────────────────────────────────────────
    SIMILARITY_WEIGHTS: dict = {
        "skill_overlap": 0.40,
        "experience_relevance": 0.25,
        "industry_alignment": 0.15,
        "salary_band_compatibility": 0.20,
    }

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()


# ── Logging Configuration ──────────────────────────────────────────────────────
import logging

LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
        "detailed": {
            "format": "%(asctime)s | %(levelname)-8s | %(name)s:%(lineno)d | %(message)s",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "default",
            "level": "DEBUG" if settings.DEBUG else "INFO",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "DEBUG" if settings.DEBUG else "INFO",
    },
    "loggers": {
        "uvicorn": {"level": "INFO"},
        "sqlalchemy.engine": {"level": "WARNING"},
        "careeriq": {"level": "DEBUG" if settings.DEBUG else "INFO"},
    },
}

logging.config.dictConfig(LOGGING_CONFIG) if __name__ != "__main__" else None
logger = logging.getLogger("careeriq")
