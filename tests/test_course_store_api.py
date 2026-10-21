from datetime import datetime, timedelta, timezone

import jwt
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings
from app.db.database import Base, get_db
from app.main import app
from app.models.course import Course
from app.models.user import User


@pytest.fixture
def setup_client():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    TestingSession = sessionmaker(bind=engine, autoflush=False)
    Base.metadata.create_all(engine)
    with TestingSession() as db:
        first = User(email="first@example.com", password="pw", name="First User")
        second = User(email="second@example.com", password="pw", name="Second User")
        db.add_all([first, second])
        db.commit()
        db.refresh(first)
        db.add_all([
            Course(title="Old", description="Description", instructor_name="First User", category="Tech", price=100,
                   curriculum="Lesson", created_by=first.idx, is_published=True),
            Course(title="Hidden", description="Description", instructor_name="First User", category="Tech", price=50,
                   curriculum="Lesson", created_by=first.idx, is_published=False),
            Course(title="New", description="Description", instructor_name="First User", category="Tech", price=150,
                   curriculum="Lesson", created_by=first.idx, is_published=True),
        ])
        db.commit()

    def override_db():
        with TestingSession() as db:
            yield db

    app.dependency_overrides[get_db] = override_db
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(engine)


def auth(email="first@example.com"):
    payload = {"sub": email, "exp": datetime.now(timezone.utc) + timedelta(minutes=5)}
    return {"EN_AT": jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)}


def test_catalog_and_detail_are_public_and_hide_unpublished(setup_client):
    client = setup_client
    response = client.get("/api/course/list")
    assert response.status_code == 200
    assert response.json()["result"]["total"] == 2
    assert [item["title"] for item in response.json()["result"]["items"]] == ["New", "Old"]
    assert client.get("/course/read/2").status_code == 404
    assert client.get("/course/read/1").json()["result"]["curriculum"] == "Lesson"


def test_register_requires_login_and_uses_user_identity(setup_client):
    client = setup_client
    body = {"title": "New", "description": "Description", "category": "Tech", "price": 2500,
            "curriculum": "Lesson 1", "instructor_name": "Forged", "created_by": 999}
    assert client.post("/api/course/register", json=body).status_code == 401
    response = client.post("/api/course/register", json=body, cookies=auth())
    assert response.status_code == 201
    result = response.json()["result"]
    assert result["instructor_name"] == "First User"
    assert result["created_by"] == 1


def test_register_validation_errors(setup_client):
    response = setup_client.post("/course/register", json={"title": " ", "description": "D", "category": "X", "price": -1, "curriculum": "\n"}, cookies=auth())
    assert response.status_code == 422


def test_order_snapshots_values_and_filters_history_to_buyer(setup_client):
    client = setup_client
    body = {"course_id": 1, "buyer_id": 999, "amount": 1, "status": "paid"}
    assert client.post("/order/register", json=body).status_code == 401
    response = client.post("/api/order/register", json=body, cookies=auth())
    assert response.status_code == 201
    order = response.json()["result"]
    assert (order["course_title"], order["amount"], order["status"]) == ("Old", 100, "pending_payment")
    created_at = datetime.fromisoformat(order["created_at"])
    assert created_at.tzinfo is not None
    assert created_at.utcoffset() == timedelta(0)
    assert client.get("/order/list", cookies=auth("second@example.com")).json()["result"] == {"items": [], "total": 0}
    assert client.get("/order/list", cookies=auth()).json()["result"]["total"] == 1


@pytest.mark.parametrize("course_id", [2, 999])
def test_order_rejects_unpublished_or_missing_course(setup_client, course_id):
    response = setup_client.post("/order/register", json={"course_id": course_id}, cookies=auth())
    assert response.status_code == 404
