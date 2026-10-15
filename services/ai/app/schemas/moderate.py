from typing import Literal

from pydantic import Field

from app.schemas.base import WireModel


class ModerateImageRequest(WireModel):
    """공방에서 올린 흉상 초상 그림을 검수한다 (Nest가 저장하기 전에 부른다)."""

    # base64 원본 (Nest가 150KB 이하로 검사한 그림 → base64로 약 200KB)
    image: str = Field(max_length=260_000)
    mime: Literal["image/webp", "image/jpeg", "image/png"]


class ModerateImageResponse(WireModel):
    # ok: 바로 공개 / review: 운영자가 확인할 때까지 남에게 보이지 않음 / block: 올리지 못함
    verdict: Literal["ok", "review", "block"]
    # 걸린 항목 (sexual·minor·gore·hate·self_harm·real_person)
    flags: list[str] = Field(default_factory=list)
    reason: str = ""
