from app.core.config import Settings
import pytest
from pydantic import ValidationError


def test_settings_load_backend_values_from_shared_env_file(tmp_path, monkeypatch):
    monkeypatch.delenv("PORTONE_API_SECRET", raising=False)
    monkeypatch.delenv("PORTONE_API_BASE_URL", raising=False)
    env_file = tmp_path / ".env"
    env_file.write_text(
        "PORTONE_API_SECRET=test-server-secret\n"
        "PORTONE_API_BASE_URL=https://payments.example.test\n"
        "VITE_PORTONE_STORE_ID=test-store\n"
        "VITE_PORTONE_CHANNEL_KEY=test-channel\n",
        encoding="utf-8",
    )

    settings = Settings(_env_file=env_file)

    assert settings.PORTONE_API_SECRET == "test-server-secret"
    assert settings.PORTONE_API_BASE_URL == "https://payments.example.test"
    assert "VITE_PORTONE_STORE_ID" not in settings.model_dump()
    assert "VITE_PORTONE_CHANNEL_KEY" not in settings.model_dump()


def test_cookie_and_cors_settings_load_local_overrides(tmp_path, monkeypatch):
    for name in ("COOKIE_DOMAIN", "COOKIE_SECURE", "CORS_ORIGINS"):
        monkeypatch.delenv(name, raising=False)
    env_file = tmp_path / ".env"
    env_file.write_text(
        'COOKIE_DOMAIN=\nCOOKIE_SECURE=false\nCORS_ORIGINS=["http://localhost:5173"]\n',
        encoding="utf-8",
    )
    local = Settings(_env_file=env_file)
    assert local.COOKIE_DOMAIN is None
    assert local.COOKIE_SECURE is False
    assert local.CORS_ORIGINS == ["http://localhost:5173"]


def test_credentialed_cors_rejects_wildcard_origin():
    with pytest.raises(ValidationError, match="explicit origins"):
        Settings(_env_file=None, CORS_ORIGINS=["*"])


def test_cookie_and_cors_defaults_match_https_subdomain_deployment(monkeypatch):
    for name in ("COOKIE_DOMAIN", "COOKIE_SECURE", "CORS_ORIGINS"):
        monkeypatch.delenv(name, raising=False)
    production = Settings(_env_file=None)
    assert production.COOKIE_DOMAIN == "yaaho.kro.kr"
    assert production.COOKIE_SECURE is True
    assert production.CORS_ORIGINS == ["https://www.yaaho.kro.kr"]
