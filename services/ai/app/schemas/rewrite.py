from typing import Literal

from pydantic import Field

from app.schemas.base import WireModel


class RewriteRequest(WireModel):
    character_name: str = Field(max_length=60)
    speaker_name: str = Field(max_length=60)
    role: Literal["user", "character"]
    original: str = Field(min_length=1, max_length=4000)
    direction: str = Field(min_length=1, max_length=400)
    model: str | None = None
    provider: str | None = None


class RewriteResponse(WireModel):
    text: str
