"""기동 확인과, v1에서 닫아 둔 학습 경로."""

import threading
from datetime import datetime, timezone
from typing import NoReturn

from fastapi import HTTPException

from app.modules.runtime import llm

_BLOCKED_DETAIL = (
    "학습 API는 v1에서 막혀 있다. 미구현이 아니라 의도적으로 닫아 둔 것이다 "
    "(기획서 7.6장·7.7장). 경로만 설계에 남겨 두고, 로그가 쌓인 뒤 v2에서 연다."
)


def start_background() -> None:
    """기동 때 모델 예열과 공통 말투 색인을 뒤에서 돌린다. 실패해도 서버는 올라간다."""
    poke_warm()
    threading.Thread(target=_index_common_language, name="chroma-common", daemon=True).start()


def poke_warm() -> dict[str, str]:
    """대화 화면이 열릴 때 로컬 모델을 올려 둔다. OLLAMA_WARMUP=1이 아니면 바로 돌아온다."""
    threading.Thread(target=llm.warm_up, name="ollama-warmup", daemon=True).start()
    return {"status": "ok"}


def _index_common_language() -> None:
    try:
        from app.orchestration import memory

        memory.index_common()
    except Exception:
        return


def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "ai",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def block_train(job_id: str | None = None) -> NoReturn:
    detail = _BLOCKED_DETAIL if job_id is None else f"{_BLOCKED_DETAIL} (요청 작업: {job_id})"
    raise HTTPException(status_code=403, detail=detail)
