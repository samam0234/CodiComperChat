"""월드코퍼챗 (2026-11-06): 한 세계관 안에서 여러 캐릭터와 이어 가는 이야기.

Nest가 세계관·등장인물·파트·장소·그림 이름표·최근 대화를 조립해 넘긴다. FastAPI는 DB를 보지 않는다.
"""

from typing import Literal

from pydantic import Field

from app.schemas.base import WireModel
from app.schemas.context import Turn, UserPersona

WorldMode = Literal["chat", "visual_novel", "novel", "messenger"]


class WorldInfo(WireModel):
    title: str = Field(max_length=60)
    setting: str = Field(max_length=4000)
    rules: str = Field(default="", max_length=2000)
    mode: WorldMode = "chat"


class WorldPart(WireModel):
    title: str = Field(max_length=60)
    goal: str = Field(max_length=1000)
    opening: str = Field(default="", max_length=1000)


class WorldCastMember(WireModel):
    name: str = Field(max_length=30)
    summary: str = Field(max_length=1000)
    speech: str = Field(default="", max_length=500)
    # 지금 있는 장소 이름 (없으면 빈 문자열)
    place: str = Field(default="", max_length=40)


class WorldImageTag(WireModel):
    """제작자가 올린 장면 그림의 이름표. 그림 본문은 보내지 않는다 — 모델은 이름표 중 하나를 고르기만 한다."""

    label: str = Field(max_length=40)
    character: str = Field(default="", max_length=30)


class WorldTurnRequest(WireModel):
    world: WorldInfo
    part: WorldPart | None = None
    cast: list[WorldCastMember] = Field(min_length=1, max_length=12)
    places: list[str] = Field(default_factory=list, max_length=40)
    images: list[WorldImageTag] = Field(default_factory=list, max_length=60)
    recent_turns: list[Turn] = Field(default_factory=list, max_length=40)
    story_so_far: str | None = Field(default=None, max_length=1200)
    user_persona: UserPersona | None = None
    user_turn: str = Field(max_length=2000)
    # 성인 확인을 마친 계정인가 (Nest가 매 턴 DB로 본다)
    adult: bool = False
    # 방금 끝난 이벤트 미니게임 결과 한 줄 (이야기에 자연스럽게 녹인다)
    event_note: str | None = Field(default=None, max_length=200)


class WorldMove(WireModel):
    name: str
    place: str


class WorldTurnResponse(WireModel):
    reply: str
    # 고른 장면 그림 이름표 (없으면 None). Nest가 실제로 있는 이름표인지 한 번 더 본다
    image: str | None = None
    # 이번 답에서 장소를 옮긴 인물
    moves: list[WorldMove] = Field(default_factory=list)


class PartCheckRequest(WireModel):
    part: WorldPart
    turns: list[Turn] = Field(min_length=1, max_length=40)
    story_so_far: str | None = Field(default=None, max_length=1200)
    user_name: str = Field(default="유저", max_length=30)


class PartCheckResponse(WireModel):
    done: bool
    evidence: str = ""
