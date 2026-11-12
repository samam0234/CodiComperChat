"""오퍼레이션 순서. 속마음, 일기, 게시판은 같은 대화 맥락을 쓰고 결과만 다르다."""

from app.services.ops import operations
from app.schemas.ops.operations import (
    BoardCommentsRequest,
    BoardCommentsResponse,
    BoardPostsRequest,
    BoardPostsResponse,
    DiaryRequest,
    DiaryResponse,
    MindRequest,
    MindResponse,
)


def mind(request: MindRequest) -> MindResponse:
    return operations.mind(request)


def diary(request: DiaryRequest) -> DiaryResponse:
    return operations.diary(request)


def posts(request: BoardPostsRequest) -> BoardPostsResponse:
    return operations.board_posts(request)


def comments(request: BoardCommentsRequest) -> BoardCommentsResponse:
    return operations.board_comments(request)
