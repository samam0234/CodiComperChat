"""프리미엄 모델(Claude·Grok) 호출. 대화 답을 쓰는 /infer만 여기로 온다.

요약·판정·그림 설계·검수는 언제나 로컬 Ollama가 맡는다. 특히 성인 모드 그림 설계는 여기로 오지 않는다 —
Anthropic 사용 정책이 성적 콘텐츠 생성을 금지하기 때문이다.

오류 문구는 유저에게 그대로 보이므로 공급자 응답 본문을 넣지 않는다. 키는 환경변수에서만 읽고 출력하지 않는다.
"""

import logging
import os

import anthropic
import httpx
import httpx2
from fastapi import HTTPException

logger = logging.getLogger(__name__)

# 답 1번 기준. 추론 토큰도 Claude의 max_tokens에 함께 잡혀서 로컬 모델의 1200보다 넉넉히 둔다
# (Fable 5.1 기준 최대 원가도 코레딧 값 안에 들어온다: docs/plan/AI_MODEL_STRATEGY.md)
CLAUDE_MAX_TOKENS = 4000
# 캐릭터 대화는 깊은 추론이 필요 없다. 낮은 effort가 답 속도와 원가에 모두 낫다
CLAUDE_EFFORT = "low"
# effort를 받지 않는 모델
CLAUDE_NO_EFFORT = frozenset({"claude-haiku-4-5"})
# 안전 분류기가 거절할 수 있어 서버 쪽 대체 모델을 켜 두는 모델
CLAUDE_FALLBACK_BETA = "server-side-fallback-2026-07-01"
CLAUDE_FALLBACK_MODELS = frozenset({"claude-fable-5-1", "claude-opus-5-5", "claude-opus-5", "claude-sonnet-5-5"})

XAI_BASE_URL = "https://api.x.ai/v1"
REQUEST_TIMEOUT_SECONDS = 60.0

NOT_CONFIGURED = "이 모델은 아직 준비 중이에요."
UNAVAILABLE = "프리미엄 모델 연결이 원활하지 않아요. 잠시 뒤에 다시 시도해 주세요."
FAILED = "프리미엄 모델이 답을 만들지 못했어요. 쓴 코레딧은 돌려드렸어요."
REFUSED = "이 모델이 이번 내용에는 답하지 않았어요. 쓴 코레딧은 돌려드렸어요. 내용을 바꾸거나 다른 모델을 골라 주세요."


def _api_key(name: str) -> str:
    key = os.environ.get(name, "").strip()
    if not key:
        logger.warning("%s가 설정되어 있지 않다", name)
        raise HTTPException(status_code=503, detail=NOT_CONFIGURED)
    return key


def _claude_messages(contents: list[dict[str, object]]) -> list[dict[str, object]]:
    """Claude는 첫 메시지가 user여야 하고 빈 내용을 받지 않는다. 대화는 캐릭터의 첫 인사로 시작할 수 있다."""
    messages = [{"role": c["role"], "content": c["content"]} for c in contents if str(c["content"]).strip()]
    if messages and messages[0]["role"] != "user":
        messages.insert(0, {"role": "user", "content": "(대화 시작)"})
    return messages


def generate_claude(
    *,
    model: str,
    system: str,
    contents: list[dict[str, object]],
    # 시험에서 가짜 전송 계층을 넣을 때만. SDK는 httpx가 아니라 httpx2를 쓴다
    http_client: httpx2.Client | None = None,
) -> str:
    client = anthropic.Anthropic(
        api_key=_api_key("ANTHROPIC_API_KEY"),
        timeout=REQUEST_TIMEOUT_SECONDS,
        max_retries=1,
        http_client=http_client,
    )
    # 새 모델은 temperature를 받지 않아(400) 어떤 Claude에도 보내지 않는다
    params: dict = {
        "model": model,
        "max_tokens": CLAUDE_MAX_TOKENS,
        "system": system,
        "messages": _claude_messages(contents),
        "cache_control": {"type": "ephemeral"},
    }
    if model not in CLAUDE_NO_EFFORT:
        params["output_config"] = {"effort": CLAUDE_EFFORT}
    try:
        if model in CLAUDE_FALLBACK_MODELS:
            response = client.beta.messages.create(betas=[CLAUDE_FALLBACK_BETA], fallbacks="default", **params)
        else:
            response = client.messages.create(**params)
    except (anthropic.AuthenticationError, anthropic.PermissionDeniedError) as exc:
        logger.error("Claude 인증 실패: %s", exc.status_code)
        raise HTTPException(status_code=503, detail=NOT_CONFIGURED) from exc
    except anthropic.RateLimitError as exc:
        raise HTTPException(status_code=503, detail=UNAVAILABLE) from exc
    except anthropic.APIStatusError as exc:
        logger.error("Claude 호출 실패: %s %s", exc.status_code, model)
        raise HTTPException(status_code=502, detail=FAILED) from exc
    except anthropic.APIConnectionError as exc:
        raise HTTPException(status_code=503, detail=UNAVAILABLE) from exc

    if response.stop_reason == "refusal":
        logger.info("Claude 거절: %s", model)
        raise HTTPException(status_code=502, detail=REFUSED)
    text = "".join(block.text for block in response.content if block.type == "text").strip()
    if not text:
        logger.error("Claude 빈 답: %s stop_reason=%s", model, response.stop_reason)
        raise HTTPException(status_code=502, detail=FAILED)
    return text


def generate_grok(
    *,
    model: str,
    system: str,
    contents: list[dict[str, object]],
    max_output_tokens: int,
    temperature: float | None = None,
) -> str:
    key = _api_key("XAI_API_KEY")
    payload: dict[str, object] = {
        "model": model,
        "input": [{"role": "system", "content": system}, *contents],
        "max_output_tokens": max_output_tokens,
        # 기본은 공급자 서버에 30일 보관한다. 대화 내용을 남기지 않게 끈다
        "store": False,
    }
    if temperature is not None:
        payload["temperature"] = temperature
    try:
        response = httpx.post(
            f"{os.environ.get('XAI_BASE_URL', XAI_BASE_URL)}/responses",
            json=payload,
            headers={"Authorization": f"Bearer {key}"},
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        status = exc.response.status_code
        logger.error("Grok 호출 실패: %s %s", status, model)
        if status in (401, 403):
            raise HTTPException(status_code=503, detail=NOT_CONFIGURED) from exc
        if status == 429:
            raise HTTPException(status_code=503, detail=UNAVAILABLE) from exc
        raise HTTPException(status_code=502, detail=FAILED) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=503, detail=UNAVAILABLE) from exc

    text = "".join(
        part.get("text", "")
        for item in response.json().get("output", [])
        if item.get("type") == "message"
        for part in item.get("content", [])
        if part.get("type") == "output_text"
    ).strip()
    if not text:
        logger.error("Grok 빈 답: %s", model)
        raise HTTPException(status_code=502, detail=FAILED)
    return text
