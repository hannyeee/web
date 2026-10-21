from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.config import settings
from app.db.database import get_db
from app.models.course import Course
from app.models.course_order import CourseOrder
from app.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.course_order import OrderCompleteReq, OrderCreateReq, OrderCreateRes, OrderListRes, OrderRes
from app.services.portone import PortoneAPIError, PortoneClient

router = APIRouter(prefix="/order", tags=["order"])


def get_portone_client():
    if not settings.PORTONE_API_SECRET:
        yield None
        return
    client = PortoneClient(
        api_secret=settings.PORTONE_API_SECRET,
        base_url=settings.PORTONE_API_BASE_URL,
    )
    try:
        yield client
    finally:
        client.close()


@router.post(
    "/register",
    response_model=ApiResponse[OrderCreateRes],
    response_model_exclude_none=True,
    status_code=status.HTTP_201_CREATED,
)
def register_order(req: OrderCreateReq, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    course = db.scalar(select(Course).where(Course.idx == req.course_id, Course.is_published.is_(True)))
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")
    free_order = course.price == 0
    order = CourseOrder(
        buyer_id=user.idx,
        course_id=course.idx,
        course_title=course.title,
        amount=course.price,
        status="paid" if free_order else "pending_payment",
        paid_at=datetime.now(timezone.utc) if free_order else None,
    )
    db.add(order)
    db.flush()
    if not free_order:
        order.payment_id = f"course-{order.idx}-{uuid4().hex}"
    db.commit()
    db.refresh(order)
    return {"code": 201, "message": "success", "result": order}


@router.post("/complete", response_model=ApiResponse[OrderRes])
def complete_order_payment(
    req: OrderCompleteReq,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
    portone: PortoneClient | None = Depends(get_portone_client),
):
    order = db.scalar(
        select(CourseOrder).where(CourseOrder.idx == req.order_id, CourseOrder.buyer_id == user.idx)
    )
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.payment_id is None or req.payment_id != order.payment_id:
        raise HTTPException(status_code=409, detail="Payment does not match order")
    if order.status == "paid":
        return {"code": 200, "message": "success", "result": order}
    if portone is None:
        raise HTTPException(status_code=503, detail="Payment service is not configured")

    try:
        payment = portone.get_payment(order.payment_id)
    except PortoneAPIError as exc:
        raise HTTPException(status_code=502, detail="Payment provider is unavailable") from exc

    amount = payment.get("amount")
    if (
        payment.get("id") != order.payment_id
        or payment.get("status") != "PAID"
        or payment.get("currency") != "KRW"
        or not isinstance(amount, dict)
        or amount.get("total") != order.amount
    ):
        raise HTTPException(status_code=409, detail="Payment is not verified")

    order.status = "paid"
    order.paid_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(order)
    return {"code": 200, "message": "success", "result": order}


@router.get("/list", response_model=ApiResponse[OrderListRes])
def list_orders(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    criteria = CourseOrder.buyer_id == user.idx
    items = db.scalars(select(CourseOrder).where(criteria).order_by(CourseOrder.idx.desc())).all()
    total = db.scalar(select(func.count()).select_from(CourseOrder).where(criteria)) or 0
    return {"code": 200, "message": "success", "result": {"items": items, "total": total}}
