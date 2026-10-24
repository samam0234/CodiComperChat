"""공방 초상 AI 만들기 (Nest가 고른 항목과 카드의 외형 서술을 넘긴다)."""

from typing import Literal

from pydantic import Field

from app.schemas.base import WireModel
from app.schemas.photonet import PhotonetStyle


class PortraitOptions(WireModel):
    gender: Literal["female", "male", "other"] = "female"
    # 성인만 (20대부터)
    age: Literal["20s", "30s", "40s", "50s"] = "20s"
    hair_color: Literal["black", "brown", "blonde", "silver", "red", "blue", "pink", "white"] = "black"
    hair_style: Literal["short", "bob", "long", "ponytail", "wavy", "updo"] = "long"
    eye_color: Literal["black", "brown", "blue", "green", "red", "purple", "gold"] = "brown"
    outfit: Literal["casual", "suit", "knit", "dress", "armor", "robe", "hanbok", "sports"] = "casual"
    expression: Literal["smile", "calm", "cold", "shy", "playful", "serious"] = "smile"
    background: Literal["plain", "indoor", "outdoor", "city", "fantasy"] = "plain"


class PortraitRequest(WireModel):
    style: PhotonetStyle
    options: PortraitOptions = Field(default_factory=PortraitOptions)
    # 카드의 외형 서술 + 분위기 키워드 (한국어, 비어 있어도 된다)
    appearance: str = Field(default="", max_length=1000)
    # 유저가 덧붙인 생김새 (한국어)
    extra: str = Field(default="", max_length=100)
    # 저장할 수 있는 크기 상한 (Nest 초상 상한)
    max_bytes: int = Field(default=150_000, ge=10_000, le=300_000)


class PortraitResponse(WireModel):
    # 정사각형 WebP base64
    image: str
    mime: Literal["image/webp"] = "image/webp"
    prompt_used: str
