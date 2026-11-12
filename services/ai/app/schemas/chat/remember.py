from typing import Literal

from pydantic import Field

from app.schemas.base import WireModel


class RememberTurn(WireModel):
    role: Literal["user", "character"]
    text: str = Field(max_length=4000)


class RememberRequest(WireModel):
    character_name: str = Field(max_length=60)
    # 유저가 연기한 주인공 이름. 기억 문장의 주어가 된다
    user_name: str = Field(max_length=20)
    # 이미 저장된 기억 — 같은 내용을 또 만들지 않게 넘긴다
    existing: list[str] = Field(default_factory=list, max_length=60)
    turns: list[RememberTurn] = Field(min_length=1, max_length=40)


class RememberResponse(WireModel):
    memories: list[str]
