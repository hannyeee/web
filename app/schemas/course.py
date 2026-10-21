from pydantic import AnyHttpUrl, BaseModel, ConfigDict, Field, field_validator


class CourseCreateReq(BaseModel):
    title: str = Field(min_length=1, max_length=60)
    description: str = Field(min_length=1)
    category: str = Field(min_length=1, max_length=40)
    price: int = Field(ge=0, strict=True)
    image_url: str | None = None
    curriculum: str = Field(min_length=1)

    @field_validator("title", "description", "category", "curriculum")
    @classmethod
    def reject_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("must not be blank")
        return value

    @field_validator("image_url")
    @classmethod
    def validate_image_url(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return str(AnyHttpUrl(value))

    @field_validator("curriculum")
    @classmethod
    def require_lesson(cls, value: str) -> str:
        if not any(line.strip() for line in value.splitlines()):
            raise ValueError("at least one lesson is required")
        return value


class CourseRes(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    idx: int
    title: str
    description: str
    instructor_name: str
    category: str
    price: int
    image_url: str | None
    curriculum: str
    created_by: int


class CourseSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    idx: int
    title: str
    description: str
    instructor_name: str
    category: str
    price: int
    image_url: str | None


class CourseListRes(BaseModel):
    items: list[CourseSummary]
    total: int
