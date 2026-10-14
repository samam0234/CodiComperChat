from typing import Literal

from pydantic import Field

from app.schemas.base import WireModel

CampaignRole = Literal["companion", "rival", "client", "guide", "wildcard"]


class SpeechRules(WireModel):
    honorific: Literal["banmal", "jondae", "mix"]
    address_as: str
    forbidden: list[str]
    habits: list[str]


class CharacterCore(WireModel):
    """카드 전체가 아니라 추론에 필요한 핵심만 (기획서 13.3장).

    미해금 비밀은 본문을 넘기지 않는다. 주제만 넘겨 모델이 먼저 꺼내지 않게 한다.
    """

    name: str
    role: CampaignRole
    warmth: int
    directness: int
    impulse: int
    protectiveness: int
    speech: SpeechRules
    summary: str
    never_do: list[str]
    locked_secret_topics: list[str]
    unlocked_secrets: list[str]


class RelationAxis(WireModel):
    """숫자만 두지 않고 최근 근거 한 줄을 함께 넘긴다 (기획서 4.2장)."""

    name: str
    value: int
    reason: str


class Hook(WireModel):
    id: str
    text: str


class LoreEntry(WireModel):
    keyword: str
    content: str


class MemoryChunk(WireModel):
    id: str
    text: str


class Turn(WireModel):
    role: Literal["user", "character"]
    text: str


class CampaignStateSlice(WireModel):
    relations: list[RelationAxis]
    open_hooks: list[Hook]
    knowledge: list[str]


class UserPersona(WireModel):
    """유저가 연기하는 주인공. 유저가 직접 쓴 글이라 지시가 아니라 설정 자료로만 다룬다."""

    name: str = Field(max_length=20)
    description: str = Field(default="", max_length=300)


class ExtraCharacter(WireModel):
    """유저가 만든 조연(엑스트라). Nest가 이번 턴 등장 조건에 맞은 것만 보낸다.
    유저가 쓴 글이라 지시가 아니라 설정 자료로만 다룬다."""

    name: str = Field(max_length=20)
    summary: str = Field(max_length=60)
    personality: str = Field(default="", max_length=200)
    relation: str = Field(default="", max_length=120)
    situation: str = Field(default="", max_length=200)
    place: str = Field(default="", max_length=120)
    reason: str = Field(default="", max_length=120)
    # 등장 방식을 정하는 신호: 이름 언급 / 인물 관계 / 상황 / 장소 / 방금 등장해 있음
    cue: Literal["name", "relation", "situation", "place", "continuity"] = "relation"


class ContextSlice(WireModel):
    """Nest가 조립해 넘기는 것. FastAPI는 DB를 직접 보지 않는다 (기획서 7.4장)."""

    character: CharacterCore
    state: CampaignStateSlice
    active_lore: list[LoreEntry]
    recent_turns: list[Turn]
    retrieved_memories: list[MemoryChunk]
    director_note: str | None = None
    user_persona: UserPersona | None = None
    # 유저가 캐릭터 상태설정에서 정한 호칭. 있으면 카드의 호칭 규칙보다 우선한다
    address_override: str | None = Field(default=None, max_length=20)
    # 이번 턴에 등장할 수 있는 엑스트라 (조건에 안 맞으면 Nest가 아예 빼고 보낸다)
    extras: list[ExtraCharacter] = Field(default_factory=list, max_length=3)
