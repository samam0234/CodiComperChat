"""FastAPI는 Nest만 부른다. 토큰이 있으면 그 값만 받고, 없으면 루프백만 받는다.

운영(APP_ENV=production)에서는 토큰이 필수이고 개발용 가짜 스위치가 켜져 있으면 시작하지 않는다.
"""

import hashlib
import hmac
import os

from fastapi import Request
from fastapi.responses import JSONResponse

TOKEN_HEADER = "x-ai-token"
LOOPBACK = {"127.0.0.1", "::1", "localhost"}
DEV_FLAGS = ("LLM_FAKE", "IMAGE_FAKE")


def token_matches(given: str, expected: str) -> bool:
    """길이가 달라도 비교 시간이 비밀 길이를 드러내지 않게 해시로 견준다."""
    return hmac.compare_digest(
        hashlib.sha256(given.encode()).digest(),
        hashlib.sha256(expected.encode()).digest(),
    )


def client_host(request: Request) -> str:
    if request.client is None:
        return ""
    return request.client.host


def assert_production_safety() -> None:
    if os.environ.get("APP_ENV") != "production":
        return
    problems: list[str] = []
    token = os.environ.get("AI_SERVICE_TOKEN", "")
    if len(token) < 32:
        problems.append("AI_SERVICE_TOKEN 이 없거나 32자보다 짧다.")
    for key in DEV_FLAGS:
        if os.environ.get(key):
            problems.append(f"{key} 는 운영에서 켤 수 없다.")
    if problems:
        raise RuntimeError("운영 안전 검사를 통과하지 못했다.\n- " + "\n- ".join(problems))


async def internal_auth(request: Request, call_next):
    host = client_host(request)
    token = os.environ.get("AI_SERVICE_TOKEN", "")
    # 상태 확인은 이 기계에서만, 토큰 없이 연다 (바깥 포트 포워딩은 아래가 막는다)
    if request.url.path == "/health" and host in LOOPBACK:
        return await call_next(request)
    if token:
        if token_matches(request.headers.get(TOKEN_HEADER, ""), token):
            return await call_next(request)
        return JSONResponse(status_code=401, content={"detail": "내부 인증이 필요합니다."})
    if host in LOOPBACK:
        return await call_next(request)
    return JSONResponse(status_code=403, content={"detail": "이 서비스는 내부망에서만 호출할 수 있습니다."})
