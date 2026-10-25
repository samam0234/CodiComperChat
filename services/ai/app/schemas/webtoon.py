"""웹툰 (오퍼레이션): 대화를 여러 컷으로. 콘티를 먼저 쓰고(무료), 컷은 Nest가 하나씩 그리게 한다(한 컷 45 코레딧)."""

from typing import Literal

from pydantic import Field

from app.schemas.base import WireModel
from app.schemas.context import ContextSlice
from app.schemas.photonet import CastMember, FocusTurn, PhotonetRating

MIN_PANELS = 2
MAX_PANELS = 6


class WebtoonPlanRequest(WireModel):
    context: ContextSlice
    # 유저가 쓴 장면 설명 (한국어). 대사를 골랐으면 비어 있어도 된다
    prompt: str = Field(default="", max_length=300)
    rating: PhotonetRating = "sfw"
    panels: int = Field(ge=MIN_PANELS, le=MAX_PANELS)
    cast: list[CastMember] = Field(default_factory=list, max_length=8)
    focus: list[FocusTurn] = Field(default_factory=list, max_length=8)


class SpeechLine(WireModel):
    speaker: str = Field(max_length=20)
    text: str = Field(max_length=60)


class PanelPlan(WireModel):
    # 장면 설계표 (photonet.compose가 읽는 모양 + shot). 그릴 때 그대로 돌려받는다
    plan: dict
    # 해설 상자 (없으면 빈 문자열)
    caption: str = ""
    lines: list[SpeechLine] = Field(default_factory=list)


class WebtoonPlanResponse(WireModel):
    title: str
    panels: list[PanelPlan]


class WebtoonPanelRequest(WireModel):
    plan: dict
    rating: PhotonetRating = "sfw"
    ratio: Literal["정사각", "세로", "가로"] = "가로"


class WebtoonPanelResponse(WireModel):
    # WebP base64
    image: str
    mime: Literal["image/webp"] = "image/webp"
    width: int
    height: int
    prompt_used: str
