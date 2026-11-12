"""코디포토넷: 대화 장면을 그림으로 (Nest가 대화 맥락·등장인물 명단을 조립해 넘긴다)."""

from typing import Literal

from pydantic import Field

from app.schemas.base import WireModel
from app.schemas.context import ContextSlice

PhotonetStyle = Literal["애니메이션", "웹툰", "수채화", "실사풍"]
PhotonetRatio = Literal["정사각", "세로", "가로"]
# sfw: 전체 이용가(기본) / nsfw: 성인 — Nest가 성인 확인을 마친 계정만 보낸다
PhotonetRating = Literal["sfw", "nsfw"]


class CastMember(WireModel):
    """그림에 나올 수 있는 사람. 캐릭터 카드·내 프로필·이 대화의 지인(엑스트라)에서 Nest가 모은다."""

    name: str = Field(max_length=20)
    # character: 대화 상대 캐릭터 / protagonist: 내가 연기하는 주인공 / acquaintance: 이 대화의 지인(엑스트라)
    role: Literal["character", "protagonist", "acquaintance"]
    # 카드·프로필에 적힌 그대로 (없으면 빈 칸 — 모델이 소개·외형·대화에서 추론한다)
    gender: str = Field(default="", max_length=20)
    age: str = Field(default="", max_length=20)
    occupation: str = Field(default="", max_length=60)
    appearance: str = Field(default="", max_length=600)
    about: str = Field(default="", max_length=400)


class FocusTurn(WireModel):
    """유저가 고른 대사와 그 앞뒤 (이 순간을 그린다)."""

    speaker: str = Field(max_length=20)
    text: str = Field(max_length=2000)


class PhotonetRequest(WireModel):
    context: ContextSlice
    # 유저가 쓴 장면 설명 (한국어). 대사를 골랐으면 비어 있어도 된다
    prompt: str = Field(default="", max_length=300)
    style: PhotonetStyle
    ratio: PhotonetRatio
    rating: PhotonetRating = "sfw"
    cast: list[CastMember] = Field(default_factory=list, max_length=8)
    focus: list[FocusTurn] = Field(default_factory=list, max_length=8)


class PhotonetResponse(WireModel):
    # WebP base64
    image: str
    mime: Literal["image/webp"] = "image/webp"
    width: int
    height: int
    # 엔진에 실제로 보낸 영어 프롬프트 (확인용으로 함께 남긴다)
    prompt_used: str
    # 그림에 넣은 사람 (예: "유지성(남)") — 화면에 보여 줘 빠진 사람이 있는지 알 수 있게
    cast: list[str] = Field(default_factory=list)


class PhotonetStatus(WireModel):
    ready: bool
    # 엔진은 켜져 있지만 WebUI 모델 폴더에 없는 체크포인트
    missing: list[str] = Field(default_factory=list)
