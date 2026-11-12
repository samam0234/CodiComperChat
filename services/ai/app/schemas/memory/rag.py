from pydantic import Field

from app.schemas.base import WireModel


class RagQuery(WireModel):
    user_id: str = Field(min_length=1, max_length=80)
    character_id: str = Field(min_length=1, max_length=80)
    text: str = Field(min_length=1, max_length=1000)


class RagHit(WireModel):
    personal: list[str] = Field(default_factory=list, max_length=4)
    common: list[str] = Field(default_factory=list, max_length=1)


class RagItem(WireModel):
    id: str = Field(min_length=1, max_length=80)
    text: str = Field(min_length=1, max_length=200)


class RagReplace(WireModel):
    user_id: str = Field(min_length=1, max_length=80)
    character_id: str = Field(min_length=1, max_length=80)
    items: list[RagItem] = Field(default_factory=list, max_length=40)


class RagReplaceResult(WireModel):
    stored: int
