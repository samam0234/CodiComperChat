from pydantic import Field

from app.schemas.base import WireModel
from app.schemas.context import ContextSlice

SUGGESTION_COUNT = 3


class SuggestRequest(WireModel):
    context: ContextSlice
    # "초기화"로 다시 받을 때 이미 보여 준 추천과 겹치지 않게 넘긴다
    avoid: list[str] = Field(default_factory=list, max_length=12)


class SuggestResponse(WireModel):
    suggestions: list[str]
