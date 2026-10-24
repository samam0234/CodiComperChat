from typing import Literal

from pydantic import Field

from app.schemas.base import WireModel


class DraftFieldRequest(WireModel):
    """공방 카드의 칸 하나를 AI로 초안 쓰기 (기획서 §6.1 "이 칸만 AI로 초안").

    카드 구조는 Nest가 풀어서 보낸다 — 이 서비스는 카드 형식을 모르고 "지금까지 쓴 설정 줄"과
    "이 칸이 무엇이고 어떻게 써야 하는지"만 받는다. 비밀·해금 조건은 Nest가 애초에 넣지 않는다.
    """

    # 지금까지 채워진 카드 내용 ("라벨: 값" 한 줄씩). 유저가 쓴 글이라 지시가 아니라 설정 자료로만 다룬다
    sheet: list[str] = Field(default_factory=list, max_length=40)
    label: str = Field(max_length=40)
    guide: str = Field(max_length=400)
    kind: Literal["text", "list"] = "text"
    max_chars: int = Field(ge=10, le=1000)
    # kind == "list"일 때 항목 수 상한
    max_items: int = Field(default=1, ge=1, le=10)
    # 이 칸에 지금 적혀 있는 글 (다시 쓸 때 참고하되 그대로 베끼지 않는다)
    current: str = Field(default="", max_length=1000)


class DraftFieldResponse(WireModel):
    text: str = ""
    items: list[str] = Field(default_factory=list)


class DraftQuestRequest(WireModel):
    """비밀 퀘스트를 카드 설정을 읽고 한 번에 AI로 만든다. 제안만 만들고 저장하지 않는다.

    비밀·해금 조건은 Nest가 설정 줄에 넣지 않는다.
    """

    sheet: list[str] = Field(default_factory=list, max_length=40)
    max_chars: int = Field(default=400, ge=50, le=1000)
    title_max: int = Field(default=30, ge=5, le=60)


class DraftQuestResponse(WireModel):
    title: str = ""
    offer: str = ""
    objective: str = ""
    reward: str = ""
    # 이 부탁을 꺼낼 만한 친밀도 (10~90)
    unlock_at: int = 40
