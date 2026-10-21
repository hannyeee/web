"""Seed the empty course catalog with five Korean sample courses."""

import argparse

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.course import Course
from app.models.user import User

SAMPLE_COURSES = [
    {
        "title": "FastAPI로 만드는 실전 백엔드",
        "description": "FastAPI와 SQLite로 인증, 데이터베이스, REST API를 갖춘 백엔드 서비스를 만듭니다.",
        "category": "백엔드",
        "price": 39000,
        "curriculum": "FastAPI 프로젝트 시작\n요청과 응답 모델링\nSQLite와 SQLAlchemy\n인증과 권한\n테스트와 배포",
    },
    {
        "title": "Vue 3 서비스 개발",
        "description": "Vue 3의 반응성과 컴포넌트 설계를 익혀 실제 서비스 화면을 구현합니다.",
        "category": "프론트엔드",
        "price": 35000,
        "curriculum": "Vue 프로젝트 구성\n컴포넌트와 props\n반응형 상태 관리\n라우팅과 API 연동\n프로덕션 빌드",
    },
    {
        "title": "SQL로 배우는 데이터 분석",
        "description": "기초 SQL부터 집계와 분석 쿼리까지 데이터에서 답을 찾는 방법을 배웁니다.",
        "category": "데이터 분석",
        "price": 29000,
        "curriculum": "SELECT와 필터링\nJOIN으로 데이터 결합\n그룹화와 집계\n서브쿼리와 CTE\n분석 문제 풀이",
    },
    {
        "title": "Python 자동화 기초",
        "description": "반복 작업을 줄이는 Python 스크립트와 파일, 웹 데이터 자동화를 익힙니다.",
        "category": "Python",
        "price": 25000,
        "curriculum": "Python 기초 문법\n파일과 폴더 다루기\nCSV와 엑셀 자동화\n웹 요청과 데이터 수집\n작업 스케줄링",
    },
    {
        "title": "Git과 배포 첫걸음",
        "description": "Git으로 변경 사항을 관리하고 웹 애플리케이션을 서버에 배포합니다.",
        "category": "개발 기초",
        "price": 100,
        "curriculum": "Git 저장소와 커밋\n브랜치와 병합\n원격 저장소 협업\n배포 환경 설정\n배포와 점검",
    },
]


def seed_courses(db: Session, instructor_id: int) -> int:
    instructor = db.get(User, instructor_id)
    if instructor is None:
        raise ValueError(f"Unknown instructor: {instructor_id}")
    if db.scalar(select(Course.idx).limit(1)) is not None:
        return 0

    db.add_all(
        Course(
            **sample,
            instructor_name=instructor.name,
            created_by=instructor.idx,
            is_published=True,
        )
        for sample in SAMPLE_COURSES
    )
    db.commit()
    return len(SAMPLE_COURSES)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--instructor-id", type=int, required=True)
    args = parser.parse_args()
    with SessionLocal() as db:
        try:
            inserted = seed_courses(db, args.instructor_id)
        except ValueError as exc:
            parser.error(str(exc))
    print(f"Inserted {inserted} courses.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
