from datetime import datetime, timedelta, timezone

import jwt
import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.auth import get_current_user
from app.core.config import settings
from app.db.database import Base, get_db
from app.models.user import User
from app.schemas.course import CourseCreateReq
from app.schemas.course_order import OrderCreateReq


@pytest.fixture
def client():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    TestingSession = sessionmaker(bind=engine, autoflush=False)
    Base.metadata.create_all(engine)
    with TestingSession() as db:
        db.add(User(email="user@example.com", password="pw", name="User"))
        db.commit()

    app = FastAPI()

    @app.get("/me")
    def me(user=Depends(get_current_user)):
        return {"idx": user.idx, "email": user.email}

    def override_db():
        with TestingSession() as db:
            yield db

    app.dependency_overrides[get_db] = override_db
    with TestClient(app) as tc:
        yield tc
    Base.metadata.drop_all(engine)


def token(sub="user@example.com", expired=False):
    exp = datetime.now(timezone.utc) - timedelta(minutes=1) if expired else datetime.now(timezone.utc) + timedelta(minutes=5)
    return jwt.encode({"sub": sub, "exp": exp}, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def test_cookie_resolves_existing_user(client):
    response = client.get("/me", cookies={"EN_AT": token()})
    assert response.status_code == 200
    assert response.json()["email"] == "user@example.com"


@pytest.mark.parametrize("cookie", [None, "not-a-jwt", token(expired=True), token(sub="unknown@example.com")])
def test_invalid_cookie_is_unauthorized(client, cookie):
    response = client.get("/me", cookies={} if cookie is None else {"EN_AT": cookie})
    assert response.status_code == 401


def test_course_request_validation():
    good = dict(title="Course", description="Description", category="Tech", price=0, curriculum="Lesson 1")
    assert CourseCreateReq(**good).price == 0
    for field, value in [("title", " "), ("description", " "), ("category", " "), ("price", -1), ("price", "10"), ("curriculum", " \n ")]:
        with pytest.raises(Exception):
            CourseCreateReq(**(good | {field: value}))


def test_order_request_only_accepts_positive_integer_course_id():
    assert OrderCreateReq(course_id=1).course_id == 1
    for value in [0, -1, "1"]:
        with pytest.raises(Exception):
            OrderCreateReq(course_id=value)
