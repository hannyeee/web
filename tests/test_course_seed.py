import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.db.database import Base
from app.models.course import Course
from app.models.user import User
from scripts.seed_courses import seed_courses


@pytest.fixture
def db():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine)
    with Session(engine) as session:
        instructor = User(email="teacher@example.com", password="pw", name="강의자")
        session.add(instructor)
        session.commit()
        session.refresh(instructor)
        yield session, instructor
    engine.dispose()


def test_seed_inserts_five_courses_for_selected_instructor_and_is_repeatable(db):
    session, instructor = db

    assert seed_courses(session, instructor.idx) == 5
    rows = session.scalars(select(Course).order_by(Course.idx)).all()
    assert len(rows) == 5
    assert all(row.created_by == instructor.idx and row.instructor_name == "강의자" for row in rows)
    assert all(row.is_published for row in rows)
    test_course = next(row for row in rows if row.title == "Git과 배포 첫걸음")
    assert test_course.price == 100
    assert seed_courses(session, instructor.idx) == 0
    assert len(session.scalars(select(Course)).all()) == 5


def test_seed_leaves_existing_catalog_unchanged(db):
    session, instructor = db
    existing = Course(title="기존", description="기존 강의", instructor_name="기존 강사", category="기존",
                      price=500, curriculum="1주차", created_by=instructor.idx, is_published=False)
    session.add(existing)
    session.commit()
    before = [(row.idx, row.title, row.price, row.is_published) for row in session.scalars(select(Course)).all()]

    assert seed_courses(session, instructor.idx) == 0
    assert [(row.idx, row.title, row.price, row.is_published) for row in session.scalars(select(Course)).all()] == before


def test_seed_rejects_unknown_instructor_without_partial_inserts(db):
    session, _ = db

    with pytest.raises(ValueError, match="instructor"):
        seed_courses(session, 999)

    assert session.scalars(select(Course)).all() == []
