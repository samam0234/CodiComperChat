from typing import NoReturn

from fastapi import HTTPException

from app.schemas.summarize import SummarizeRequest


def summarize_session(request: SummarizeRequest) -> NoReturn:
    raise HTTPException(
        status_code=501,
        detail=(
            "세션 요약은 아직 구현되지 않았다. 자유 산문이 아니라 SummarizeResponse "
            "형태(brief / relationDelta / hooksOpen / hooksClosed / knowledgeGained / "
            "unlocks / nextPressure)로 돌려줘야 하는 자리다 "
            f"(기획서 13.4장, 받은 세션 턴 {len(request.session_turns)}개)."
        ),
    )
