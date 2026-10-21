from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from fastapi.staticfiles import StaticFiles

from app.api.routers import board, course, order, user
from app.db.database import Base, engine
from app.db.migrations import migrate_course_orders
from app.models.board import Board
from app.models.user import User
from app.models.course import Course
from app.models.course_order import CourseOrder

app = FastAPI(title="노트 API", version="0.1.0")

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    message = exc.detail if isinstance(exc.detail, str) else "요청을 처리할 수 없습니다."
    return JSONResponse(
        status_code=exc.status_code,
        headers=exc.headers,
        content={"code": exc.status_code, "message": message, "result": None},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"code": 422, "message": "요청 값이 올바르지 않습니다.", "result": jsonable_encoder(exc.errors())},
    )


# Accept both the public /api path and the path after nginx strips /api
# (for example, with `proxy_pass http://backend/;`).
app.include_router(user.router, prefix="/api")
app.include_router(board.router, prefix="/api")
app.include_router(course.router, prefix="/api")
app.include_router(order.router, prefix="/api")
app.include_router(user.router)
app.include_router(board.router)
app.include_router(course.router)
app.include_router(order.router)

Base.metadata.create_all(bind=engine)
migrate_course_orders(engine)

# app.mount("/", StaticFiles(directory="frontend", html=True), name="frontend")
