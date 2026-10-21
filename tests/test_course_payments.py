from datetime import datetime, timedelta, timezone
from types import SimpleNamespace

import jwt
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import httpx
import pytest

from app.api.routers import order as order_router
from app.core.config import settings
from app.db.database import Base, get_db
from app.main import app
from app.models.course import Course
from app.models.user import User


@pytest.fixture
def payment_client():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    testing_session = sessionmaker(bind=engine, autoflush=False)
    Base.metadata.create_all(engine)
    with testing_session() as db:
        first = User(email="buyer@example.com", password="pw", name="Buyer")
        second = User(email="other@example.com", password="pw", name="Other")
        db.add_all([first, second])
        db.flush()
        db.add_all(
            [
                Course(
                    title="Paid course",
                    description="Description",
                    instructor_name="Instructor",
                    category="Tech",
                    price=1000,
                    curriculum="Lesson",
                    created_by=first.idx,
                    is_published=True,
                ),
                Course(
                    title="Free course",
                    description="Description",
                    instructor_name="Instructor",
                    category="Tech",
                    price=0,
                    curriculum="Lesson",
                    created_by=first.idx,
                    is_published=True,
                ),
            ]
        )
        db.commit()

    def override_db():
        with testing_session() as db:
            yield db

    app.dependency_overrides[get_db] = override_db
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(engine)
    engine.dispose()


def payment_auth(email="buyer@example.com"):
    payload = {"sub": email, "exp": datetime.now(timezone.utc) + timedelta(minutes=5)}
    return {"EN_AT": jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)}


def install_provider_override(provider):
    dependency = getattr(order_router, "get_portone_client", None)
    assert dependency is not None, "order router must expose the PortOne client dependency"
    app.dependency_overrides[dependency] = lambda: provider


def create_paid_order(client):
    response = client.post("/api/order/register", json={"course_id": 1}, cookies=payment_auth())
    assert response.status_code == 201
    return response.json()["result"]


def test_sqlite_course_order_migration_is_idempotent():
    engine = create_engine("sqlite://")
    with engine.begin() as connection:
        connection.exec_driver_sql(
            """
            CREATE TABLE course_order (
                idx INTEGER PRIMARY KEY,
                buyer_id INTEGER NOT NULL,
                course_id INTEGER NOT NULL,
                course_title VARCHAR(60) NOT NULL,
                amount INTEGER NOT NULL,
                status VARCHAR(32) NOT NULL,
                created_at DATETIME NOT NULL
            )
            """
        )

    try:
        from app.db.migrations import migrate_course_orders
    except ImportError:
        pytest.fail("migrate_course_orders must be implemented")

    migrate_course_orders(engine)
    migrate_course_orders(engine)

    columns = {column["name"] for column in inspect(engine).get_columns("course_order")}
    indexes = inspect(engine).get_indexes("course_order")
    assert {"payment_id", "paid_at"}.issubset(columns)
    assert any(index["unique"] and index["column_names"] == ["payment_id"] for index in indexes)


def test_portone_client_gets_payment_with_authorization_and_encoded_id():
    try:
        from app.services.portone import PortoneClient
    except ImportError:
        pytest.fail("PortoneClient must be implemented")

    requests = []

    def respond(request):
        requests.append(request)
        return httpx.Response(
            200,
            json={"id": "payment-123", "status": "PAID", "currency": "KRW", "amount": {"total": 1000}},
        )

    client = PortoneClient(
        api_secret="test-secret",
        base_url="https://portone.test/v2",
        transport=httpx.MockTransport(respond),
    )
    payment = client.get_payment("payment/123")

    assert payment["status"] == "PAID"
    assert requests[0].url == "https://portone.test/v2/payments/payment%2F123"
    assert requests[0].headers["Authorization"] == "PortOne test-secret"


def test_portone_client_sanitizes_upstream_error_body():
    try:
        from app.services.portone import PortoneAPIError, PortoneClient
    except ImportError:
        pytest.fail("PortoneClient and PortoneAPIError must be implemented")

    client = PortoneClient(
        api_secret="private-secret",
        transport=httpx.MockTransport(
            lambda request: httpx.Response(500, json={"detail": "private-secret upstream payload"})
        ),
    )

    with pytest.raises(PortoneAPIError) as error:
        client.get_payment("payment-123")

    assert "private-secret" not in str(error.value)
    assert "upstream payload" not in str(error.value)


def test_paid_order_creation_uses_server_values_and_unique_payment_id(payment_client):
    first = create_paid_order(payment_client)
    second = create_paid_order(payment_client)

    assert (first["course_title"], first["amount"], first["status"]) == (
        "Paid course",
        1000,
        "pending_payment",
    )
    assert first["payment_id"].startswith(f"course-{first['idx']}-")
    assert len(first["payment_id"]) <= 64
    assert first["payment_id"] != second["payment_id"]


def test_free_order_is_paid_without_portone_payment_id(payment_client):
    response = payment_client.post("/api/order/register", json={"course_id": 2}, cookies=payment_auth())

    assert response.status_code == 201
    result = response.json()["result"]
    assert result["status"] == "paid"
    assert result["paid_at"] is not None
    assert "payment_id" not in result


def test_payment_completion_verifies_provider_and_is_idempotent(payment_client):
    order = create_paid_order(payment_client)
    calls = []
    provider = SimpleNamespace(
        get_payment=lambda payment_id: calls.append(payment_id)
        or {
            "id": payment_id,
            "status": "PAID",
            "currency": "KRW",
            "amount": {"total": order["amount"]},
        }
    )
    install_provider_override(provider)
    body = {"order_id": order["idx"], "payment_id": order["payment_id"]}

    first = payment_client.post("/api/order/complete", json=body, cookies=payment_auth())
    second = payment_client.post("/api/order/complete", json=body, cookies=payment_auth())

    assert first.status_code == second.status_code == 200
    assert first.json()["result"]["status"] == second.json()["result"]["status"] == "paid"
    assert first.json()["result"]["paid_at"] is not None
    assert calls == [order["payment_id"]]


@pytest.mark.parametrize(
    "payment",
    [
        {"id": "different-payment", "status": "PAID", "currency": "KRW", "amount": {"total": 1000}},
        {"status": "FAILED", "currency": "KRW", "amount": {"total": 1000}},
        {"status": "VIRTUAL_ACCOUNT_ISSUED", "currency": "KRW", "amount": {"total": 1000}},
        {"status": "PAID", "currency": "USD", "amount": {"total": 1000}},
        {"status": "PAID", "currency": "KRW", "amount": {"total": 999}},
    ],
)
def test_payment_completion_rejects_unverified_provider_values(payment_client, payment):
    order = create_paid_order(payment_client)
    provider = SimpleNamespace(get_payment=lambda payment_id: {"id": payment_id, **payment})
    install_provider_override(provider)

    response = payment_client.post(
        "/api/order/complete",
        json={"order_id": order["idx"], "payment_id": order["payment_id"]},
        cookies=payment_auth(),
    )

    assert response.status_code == 409
    assert payment_client.get("/api/order/list", cookies=payment_auth()).json()["result"]["items"][0]["status"] == "pending_payment"


def test_payment_completion_requires_provider_payment_id(payment_client):
    order = create_paid_order(payment_client)
    provider = SimpleNamespace(
        get_payment=lambda payment_id: {
            "status": "PAID",
            "currency": "KRW",
            "amount": {"total": order["amount"]},
        }
    )
    install_provider_override(provider)

    response = payment_client.post(
        "/api/order/complete",
        json={"order_id": order["idx"], "payment_id": order["payment_id"]},
        cookies=payment_auth(),
    )

    assert response.status_code == 409


def test_payment_completion_rejects_forged_payment_id_and_other_buyers(payment_client):
    order = create_paid_order(payment_client)
    provider = SimpleNamespace(get_payment=lambda payment_id: pytest.fail("provider must not be called"))
    install_provider_override(provider)

    forged = payment_client.post(
        "/api/order/complete",
        json={"order_id": order["idx"], "payment_id": "forged-payment"},
        cookies=payment_auth(),
    )
    foreign = payment_client.post(
        "/api/order/complete",
        json={"order_id": order["idx"], "payment_id": order["payment_id"]},
        cookies=payment_auth("other@example.com"),
    )

    assert forged.status_code == 409
    assert foreign.status_code == 404


def test_payment_completion_reports_missing_secret_and_provider_failure(payment_client, monkeypatch):
    order = create_paid_order(payment_client)
    monkeypatch.setattr(settings, "PORTONE_API_SECRET", None)
    missing_secret = payment_client.post(
        "/api/order/complete",
        json={"order_id": order["idx"], "payment_id": order["payment_id"]},
        cookies=payment_auth(),
    )
    assert missing_secret.status_code == 503

    from app.services.portone import PortoneAPIError

    install_provider_override(SimpleNamespace(get_payment=lambda payment_id: (_ for _ in ()).throw(PortoneAPIError())))
    provider_failure = payment_client.post(
        "/api/order/complete",
        json={"order_id": order["idx"], "payment_id": order["payment_id"]},
        cookies=payment_auth(),
    )
    assert provider_failure.status_code == 502


def test_order_history_does_not_return_payment_id(payment_client):
    create_paid_order(payment_client)

    response = payment_client.get("/api/order/list", cookies=payment_auth())

    assert response.status_code == 200
    item = response.json()["result"]["items"][0]
    assert "payment_id" not in item
