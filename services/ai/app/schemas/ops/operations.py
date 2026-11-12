"""오퍼레이션(대화 플러그인): 심리 탐구·일기·커뮤니티. Nest가 대화 맥락(ContextSlice)을 조립해 넘긴다."""

from pydantic import Field

from app.schemas.base import WireModel
from app.schemas.context import ContextSlice


class MindRequest(WireModel):
    context: ContextSlice


class MindResponse(WireModel):
    # 캐릭터의 1인칭 속마음 독백
    inner_voice: str
    # 지금 감정 (짧은 말)
    feeling: str
    # 유저(주인공)에 대해 지금 드는 생각 한 문장
    about_user: str


class DiaryRequest(WireModel):
    context: ContextSlice


class DiaryResponse(WireModel):
    title: str
    # 오늘 기분 (짧은 말)
    mood: str
    # 일기 본문 (캐릭터의 1인칭)
    body: str


class Acquaintance(WireModel):
    """주인공의 지인(이 대화에 적용한 엑스트라). 커뮤니티에서 실명으로 언급될 수 있다."""

    name: str = Field(max_length=20)
    about: str = Field(default="", max_length=300)


class BoardComment(WireModel):
    author: str
    body: str


class BoardPost(WireModel):
    author: str
    title: str
    body: str
    comments: list[BoardComment] = Field(default_factory=list)


class BoardPostsRequest(WireModel):
    context: ContextSlice
    acquaintances: list[Acquaintance] = Field(default_factory=list, max_length=6)
    # 이미 올라온 글 제목 (겹치지 않게)
    recent_titles: list[str] = Field(default_factory=list, max_length=20)


class BoardPostsResponse(WireModel):
    posts: list[BoardPost]


class BoardCommentsRequest(WireModel):
    context: ContextSlice
    acquaintances: list[Acquaintance] = Field(default_factory=list, max_length=6)
    post_author: str = Field(max_length=20)
    post_title: str = Field(max_length=60)
    post_body: str = Field(max_length=1000)


class BoardCommentsResponse(WireModel):
    comments: list[BoardComment]
