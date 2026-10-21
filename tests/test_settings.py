from app.core.config import Settings


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
