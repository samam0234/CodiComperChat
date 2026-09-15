from typing import NoReturn

from fastapi import HTTPException


def summarize_session() -> NoReturn:
    raise HTTPException(
        status_code=501,
        detail=(
            "세션 요약은 아직 구현되지 않았다. 자유 산문이 아니라 "
            "brief / relationDelta / hooksOpen / hooksClosed / knowledgeGained / "
            "unlocks / nextPressure를 구조화해 돌려줘야 하는 자리다 (기획서 13.4장)."
        ),
    )
