from typing import NoReturn

from fastapi import HTTPException

from app.schemas.critique import CritiqueTestRequest


def critique_three_turns(request: CritiqueTestRequest) -> NoReturn:
    raise HTTPException(
        status_code=501,
        detail=(
            "공방 3턴 테스트는 아직 구현되지 않았다. 말투 붕괴·설명충화·메타 발언·"
            "비밀 누설 여부를 판정해 발행 가드에 넘겨주는 자리다 "
            f"(기획서 6.3장·7.8장, 받은 턴 {len(request.turns)}개)."
        ),
    )
