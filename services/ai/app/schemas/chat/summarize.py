from pydantic import Field

from app.schemas.base import WireModel
from app.schemas.context import ContextSlice, Hook, Turn


class RelationDelta(WireModel):
    axis: str
    delta: int
    reason: str


class QuestInput(WireModel):
    """비밀 퀘스트 판정용 (열려 있고 아직 달성 전일 때만 Nest가 보낸다). 달성 조건은 캐릭터에게 가지 않고 여기서만 쓴다."""

    offer: str = Field(max_length=4000)
    objective: str = Field(max_length=4000)
    # 이미 캐릭터가 부탁을 건넨 상태인가
    offered: bool = False
    # 달성했을 때 보여 줄 장면. 갈래가 여럿이면 달성한 순간 지금 일어난 일에 맞는 부분만 골라 돌려준다
    reward: str = Field(default="", max_length=4000)


class SummarizeRequest(WireModel):
    context: ContextSlice
    session_turns: list[Turn]
    quest: QuestInput | None = None


class SummarizeResponse(WireModel):
    """기획서 13.4장이 요구하는 형태.

    자유 산문 요약만 돌려주면 Nest가 상태를 갱신할 수 없고 사람이 손으로 세계를 고치게 된다.
    """

    brief: str
    relation_delta: list[RelationDelta]
    hooks_open: list[Hook]
    hooks_closed: list[Hook]
    knowledge_gained: list[str]
    unlocks: list[str]
    next_pressure: str
    # 비밀 퀘스트 판정 (quest가 없었으면 둘 다 False)
    quest_offered: bool = False
    quest_done: bool = False
    # quest_done일 때 reward에서 고른 장면 (원문 그대로의 일부). 고르지 못했으면 빈 문자열 — Nest는 reward 전체를 쓴다
    quest_scene: str = ""
