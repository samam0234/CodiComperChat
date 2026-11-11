"""이 요청이 사용자가 기다리는 답인지(foreground), 뒤에서 하는 정리인지(background).

Nest(apps/api/src/ai/ai-client.ts)가 `X-AI-Priority` 머리글로 알려 준다. 없으면 foreground로 본다.
배경 작업은 호스팅 API가 막혀도 CPU 예비 모델로 내려가지 않는다 — CPU 예비는 한 번에 하나만 돌아서,
몇 분 걸리는 정리가 그 자리를 차지하면 사용자가 기다리는 답의 예비까지 줄을 서게 된다(2026-11-11 실측 3분 53초).
"""

from contextvars import ContextVar

HEADER = "x-ai-priority"
_priority: ContextVar[str] = ContextVar("ai_priority", default="foreground")


def set_priority(value: str | None) -> None:
    _priority.set("background" if (value or "").strip().lower() == "background" else "foreground")


def is_background() -> bool:
    return _priority.get() == "background"
