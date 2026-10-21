from pydantic import BaseModel

class ReadRes(BaseModel):
    idx: int
    title: str
    contents: str


class ListRes(BaseModel):
    items: list[ReadRes]
    total: int

class RegisterReq(BaseModel):
    title: str
    contents: str

class RegisterRes(BaseModel):
    idx: int
    title: str
    contents: str
