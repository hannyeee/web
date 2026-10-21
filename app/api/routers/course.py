from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.database import get_db
from app.models.course import Course
from app.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.course import CourseCreateReq, CourseListRes, CourseRes, CourseSummary

router = APIRouter(prefix="/course", tags=["course"])


@router.get("/list", response_model=ApiResponse[CourseListRes])
def list_courses(db: Session = Depends(get_db)):
    items = db.scalars(select(Course).where(Course.is_published.is_(True)).order_by(Course.idx.desc())).all()
    total = db.scalar(select(func.count()).select_from(Course).where(Course.is_published.is_(True))) or 0
    return {"code": 200, "message": "success", "result": {"items": items, "total": total}}


@router.get("/read/{idx}", response_model=ApiResponse[CourseRes])
def read_course(idx: int, db: Session = Depends(get_db)):
    course = db.scalar(select(Course).where(Course.idx == idx, Course.is_published.is_(True)))
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    return {"code": 200, "message": "success", "result": course}


@router.post("/register", response_model=ApiResponse[CourseRes], status_code=status.HTTP_201_CREATED)
def register_course(req: CourseCreateReq, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    course = Course(**req.model_dump(), instructor_name=user.name, created_by=user.idx, is_published=True)
    db.add(course)
    db.commit()
    db.refresh(course)
    return {"code": 201, "message": "success", "result": course}
