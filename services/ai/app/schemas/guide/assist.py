from typing import Literal

from pydantic import Field

from app.schemas.base import WireModel


class AssistTurn(WireModel):
    role: Literal["user", "agent"]
    text: str = Field(max_length=4000)


class AssistRequest(WireModel):
    # 오래된 대화는 Nest가 잘라서 보낸다. 여기서는 상한만 건다
    history: list[AssistTurn] = Field(default_factory=list, max_length=40)
    message: str = Field(min_length=1, max_length=2000)


class AssistResponse(WireModel):
    reply: str
