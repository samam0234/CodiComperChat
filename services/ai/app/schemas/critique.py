from app.schemas.base import WireModel
from app.schemas.context import CharacterCore, Turn


class CritiqueTestRequest(WireModel):
    character: CharacterCore
    turns: list[Turn]


class CritiqueTestResponse(WireModel):
    """공방 발행 가드가 읽는 판정 (기획서 6.3장).

    secret_leak은 해금 조건 전에 비밀이 새어 나왔는지로, 프롬프트가 아니라
    서버가 검사해야 하는 항목이다 (기획서 7.8장).
    """

    tone_broken: bool
    over_explaining: bool
    meta_leak: bool
    secret_leak: bool
    notes: list[str]
