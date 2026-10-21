from sqlalchemy import func, select
from sqlalchemy.orm import Session
from app.db.database import get_db
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.board import Board
from app.schemas.board import ListRes, RegisterReq, RegisterRes, ReadRes, DeleteRes
from app.schemas.common import ApiResponse
from app.core.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/board", tags=["board"])

@router.post("/register", response_model=ApiResponse[RegisterRes], status_code=status.HTTP_201_CREATED)
def register(req: RegisterReq, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    board = Board(
        title=req.title, contents=req.contents, created_by=user.idx
    )
    db.add(board)
    db.commit()
    db.refresh(board)
    return {"code": 201, "message": "success", "result": board}

@router.get("/read/{idx}", response_model=ApiResponse[ReadRes])
def read(idx: int, db: Session = Depends(get_db)):
    board = db.get(Board, idx)
    if board is None:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    return {"code": 200, "message": "success", "result": board}


@router.get("/list", response_model=ApiResponse[ListRes])
def list_boards(db: Session = Depends(get_db)):
    items = db.scalars(select(Board).order_by(Board.idx.desc())).all()
    total = db.scalar(select(func.count()).select_from(Board)) or 0
    return {"code": 200, "message": "success", "result": {"items": items, "total": total}}


@router.delete("/delete/{idx}", response_model=ApiResponse[DeleteRes])
def delete_board(idx: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    board = db.get(Board, idx)
    if board is None:
        raise HTTPException(status_code=404, detail="게시글을 찾을 수 없습니다.")
    if board.created_by != user.idx:
        raise HTTPException(status_code=403, detail="작성자만 게시글을 삭제할 수 있습니다.")
    db.delete(board)
    db.commit()
    return {"code": 200, "message": "success", "result": {"idx": idx}}
