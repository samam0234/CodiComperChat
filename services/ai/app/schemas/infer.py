from app.schemas.base import WireModel
from app.schemas.context import ContextSlice


class InferRequest(WireModel):
    context: ContextSlice
    user_turn: str
    # 방금 쓴 답이 설정에 없는 개인사를 단정해 다시 쓸 때, Nest가 이유와 함께 넘긴다
    retry_note: str | None = None


class InferResponse(WireModel):
    reply: str
