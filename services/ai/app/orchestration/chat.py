"""1:1 대화가 거치는 순서. HTTP 라우트는 이 파일만 부른다."""

import json

from fastapi import HTTPException

from app.services.chat import grounding, inference, remember, rewrite, suggestion, summarization
from app.schemas.chat.ground import GroundCheckRequest, GroundCheckResponse
from app.schemas.chat.infer import InferRequest, InferResponse
from app.schemas.chat.remember import RememberRequest, RememberResponse
from app.schemas.chat.rewrite import RewriteRequest, RewriteResponse
from app.schemas.chat.suggest import SuggestRequest, SuggestResponse
from app.schemas.chat.summarize import SummarizeRequest, SummarizeResponse


def reply(request: InferRequest) -> InferResponse:
    return inference.run(request)


def stream(request: InferRequest):
    """로컬 조각은 나오는 대로, 실패는 NDJSON 한 줄로. 추론을 나누지는 않는다."""
    try:
        yield from inference.iter_ndjson(request)
    except HTTPException as exc:
        detail = exc.detail if isinstance(exc.detail, str) else "LLM 호출 실패"
        yield json.dumps({"error": detail, "status": exc.status_code}, ensure_ascii=False) + "\n"


def suggest(request: SuggestRequest) -> SuggestResponse:
    return suggestion.run(request)


def rewrite_line(request: RewriteRequest) -> RewriteResponse:
    return rewrite.run(request)


def ground(request: GroundCheckRequest) -> GroundCheckResponse:
    return grounding.check(request)


def memorize(request: RememberRequest) -> RememberResponse:
    return remember.run(request)


def notice(request: RememberRequest) -> RememberResponse:
    return remember.notice(request)


def summarize(request: SummarizeRequest) -> SummarizeResponse:
    return summarization.summarize_session(request)
