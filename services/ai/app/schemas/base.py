from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class WireModel(BaseModel):
    """통신 필드명은 camelCase로 고정한다.

    기획서 7.5장: 프론트 폼 상태·Nest DTO·FastAPI 입력이 같은 뼈대를 공유해야 하고,
    세 곳에서 필드명이 갈리면 공방이 먼저 망가진다. TypeScript 쪽이 camelCase이므로
    통신은 camelCase, 파이썬 내부 코드는 snake_case를 쓴다.
    """

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
