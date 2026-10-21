# 환경 설정 파일 : DB 접속 주소, 토큰 시크릿 등 환경변수로 설정된 값을 불러오는 파일

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    SECRET_KEY: str = "my-secret-key-for-jwt-must-be-32-bytes-or-more"
    ALGORITHM: str = "HS256"
    DATABASE_URL: str = "sqlite:///db.sqlite"
    PORTONE_API_SECRET: str | None = None
    PORTONE_API_BASE_URL: str = "https://api.portone.io"
    COOKIE_DOMAIN: str | None = "yaaho.kro.kr"
    COOKIE_SECURE: bool = True
    CORS_ORIGINS: list[str] = ["https://www.yaaho.kro.kr"]

    @field_validator("COOKIE_DOMAIN", mode="before")
    @classmethod
    def normalize_cookie_domain(cls, value):
        if isinstance(value, str):
            return value.strip() or None
        return value

    @field_validator("CORS_ORIGINS")
    @classmethod
    def require_explicit_origins(cls, origins):
        if "*" in origins:
            raise ValueError("CORS_ORIGINS must list explicit origins for credentialed requests")
        return origins

settings = Settings()
