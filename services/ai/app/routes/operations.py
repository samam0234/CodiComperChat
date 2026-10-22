from fastapi import APIRouter

from app.schemas.operations import (
    BoardCommentsRequest,
    BoardCommentsResponse,
    BoardPostsRequest,
    BoardPostsResponse,
    DiaryRequest,
    DiaryResponse,
    MindRequest,
    MindResponse,
)
from app.services import operations

router = APIRouter(tags=["operations"])


# 심리 탐구: 지금 장면에서 캐릭터의 속마음
@router.post("/mind", response_model=MindResponse)
def mind(request: MindRequest) -> MindResponse:
    return operations.mind(request)


# 일기: 캐릭터가 자기 입장에서 최근 일을 돌아보는 일기
@router.post("/diary", response_model=DiaryResponse)
def diary(request: DiaryRequest) -> DiaryResponse:
    return operations.diary(request)


# 커뮤니티: 캐릭터 세계 속 동네 게시판에 주민들이 올린 새 글 (댓글 포함)
@router.post("/board-posts", response_model=BoardPostsResponse)
def board_posts(request: BoardPostsRequest) -> BoardPostsResponse:
    return operations.board_posts(request)


# 커뮤니티: 내가 올린 글에 주민들이 단 댓글
@router.post("/board-comments", response_model=BoardCommentsResponse)
def board_comments(request: BoardCommentsRequest) -> BoardCommentsResponse:
    return operations.board_comments(request)
