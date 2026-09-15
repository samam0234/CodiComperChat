from typing import NoReturn

from fastapi import HTTPException


def critique_three_turns() -> NoReturn:
    raise HTTPException(
        status_code=501,
        detail=(
            "공방 3턴 테스트는 아직 구현되지 않았다. 말투 붕괴·설명충화·메타 발언 "
            "여부를 판정해 발행 가드에 넘겨주는 자리다 (기획서 6.3장·13.2장)."
        ),
    )
