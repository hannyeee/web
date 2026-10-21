from datetime import datetime, timezone

from pydantic import BaseModel, ConfigDict, Field, field_validator


class OrderCreateReq(BaseModel):
    course_id: int = Field(gt=0, strict=True)


class OrderCompleteReq(BaseModel):
    order_id: int = Field(gt=0, strict=True)
    payment_id: str = Field(min_length=6, max_length=64, strict=True)


class OrderRes(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    idx: int
    course_id: int
    course_title: str
    amount: int
    status: str
    created_at: datetime
    paid_at: datetime | None = None

    @field_validator("created_at", "paid_at")
    @classmethod
    def normalize_timestamps_to_utc(cls, value: datetime | None) -> datetime | None:
        if value is None:
            return None
        if value.tzinfo is None:
            return value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc)


class OrderListRes(BaseModel):
    items: list[OrderRes]
    total: int


class OrderCreateRes(OrderRes):
    payment_id: str | None = None
