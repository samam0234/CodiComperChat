"""코디포토넷: 대화 장면을 그림으로 (Nest가 대화 맥락을 조립해 넘긴다)."""

from typing import Literal

from pydantic import Field

from app.schemas.base import WireModel
from app.schemas.context import ContextSlice

PhotonetStyle = Literal["애니메이션", "웹툰", "수채화", "실사풍"]
PhotonetRatio = Literal["정사각", "세로", "가로"]


class PhotonetRequest(WireModel):
    context: ContextSlice
    # 유저가 쓴 장면 설명 (한국어)
    prompt: str = Field(min_length=1, max_length=300)
    style: PhotonetStyle
    ratio: PhotonetRatio


class PhotonetResponse(WireModel):
    # WebP base64
    image: str
    mime: Literal["image/webp"] = "image/webp"
    width: int
    height: int
    # 엔진에 실제로 보낸 영어 프롬프트 (확인용으로 함께 남긴다)
    prompt_used: str


class PhotonetStatus(WireModel):
    ready: bool
    # 엔진은 켜져 있지만 WebUI 모델 폴더에 없는 체크포인트
    missing: list[str] = Field(default_factory=list)
