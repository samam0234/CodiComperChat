"""오퍼레이션(대화 플러그인): 심리 탐구·일기·커뮤니티. Nest가 대화 맥락(ContextSlice)을 조립해 넘긴다."""

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
