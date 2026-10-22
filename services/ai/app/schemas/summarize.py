from app.schemas.base import WireModel
from app.schemas.context import ContextSlice, Hook, Turn


class RelationDelta(WireModel):
    axis: str
    delta: int
    reason: str


class SummarizeRequest(WireModel):
    context: ContextSlice
    session_turns: list[Turn]


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
