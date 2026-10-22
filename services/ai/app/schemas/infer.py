from pydantic import Field

from app.schemas.base import WireModel
from app.schemas.context import ContextSlice


class InferRequest(WireModel):
    context: ContextSlice
    user_turn: str
    # 방금 쓴 답이 설정에 없는 개인사를 단정해 다시 쓸 때, Nest가 이유와 함께 넘긴다
    retry_note: str | None = None
    # 이 답만 다른 Ollama 모델로 쓸 때 Nest가 넘기는 태그(예: gemma4:12b). 없으면 기본 모델.
    # 태그 모양만 받는다 — 모델 이름으로 다른 주소나 옵션을 끼워 넣지 못하게
    model: str | None = Field(default=None, pattern=r"^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$")


class InferResponse(WireModel):
    reply: str
