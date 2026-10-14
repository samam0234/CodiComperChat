from pydantic import Field

from app.schemas.base import WireModel
from app.schemas.context import CharacterCore, Turn


class CritiqueTestRequest(WireModel):
    character: CharacterCore
    turns: list[Turn]
    # 캐릭터 설정 자료(비밀 제외). 설정에 없는 개인사를 지어냈는지 판정하는 기준이 된다
    facts: list[str] = Field(default_factory=list, max_length=40)


class CritiqueTestResponse(WireModel):
    """공방 발행 가드가 읽는 판정 (기획서 6.3장).

    secret_leak은 해금 조건 전에 비밀이 새어 나왔는지로, 프롬프트가 아니라
    서버가 검사해야 하는 항목이다 (기획서 7.8장).
    invented_facts는 설정 자료에 없는 자기 개인사(가족·과거·고향 등)를 있다/없다로 단정했는지다.
    """

    tone_broken: bool
    over_explaining: bool
    meta_leak: bool
    secret_leak: bool
    invented_facts: bool = False
    notes: list[str]
