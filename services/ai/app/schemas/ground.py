from pydantic import Field

from app.schemas.base import WireModel


class GroundCheckRequest(WireModel):
    """캐릭터 답이 설정에 없는 개인사를 단정했는지 묻는다 (Nest가 근거 없는 주제를 물은 턴에서만 부른다)."""

    reply: str = Field(max_length=2000)
    # 유저가 물은 개인사 주제 (예: 취미·좋아하는 것)
    topics: list[str] = Field(default_factory=list, max_length=4)
    # 캐릭터 설정 자료(비밀 제외). 이것만 캐릭터의 사실이다
    facts: list[str] = Field(default_factory=list, max_length=60)


class GroundCheckResponse(WireModel):
    invented: bool
    note: str = ""
