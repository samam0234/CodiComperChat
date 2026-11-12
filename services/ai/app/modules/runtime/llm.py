"""대화 모델 호출 공통부. 서버 상태 확인·오류 변환을 한곳에서 한다.

백엔드 두 가지 (LLM_BACKEND):
- ollama(기본): 로컬 Ollama. GPU 기계나 CPU 서버에서 직접 돌린다
- openai: OpenAI 호환 호스팅 API (NVIDIA NIM, Google AI Studio의 호환 주소, OpenRouter 등). 무료 티어로 24시간 PC 없이 쓴다.
  LLM_FALLBACK_OLLAMA=1이면 한도 초과(429)·서버 오류·시간 초과 때 Ollama로 대신 답한다
"""

import json
import logging
import os
import time

import httpx
from fastapi import HTTPException

from app import request_priority
from app.modules.runtime import fake_llm

# 로컬에 pull된 모델 태그. 확인: `ollama list`
DEFAULT_MODEL = "gemma4:e4b"
BASIC_LOCAL_TAG = DEFAULT_MODEL
# Nest가 강화 무료에 붙이는 로컬 태그. 키가 있으면 아래 클라우드 모델로 바꾼다.
ENHANCED_LOCAL_TAG = "gemma4:12b"
NVIDIA_API_BASE = "https://integrate.api.nvidia.com/v1"
NVIDIA_API_MODEL = "google/gemma-4-31b-it"
DEFAULT_BASE_URL = "http://localhost:11434"

Contents = list[dict[str, object]]


def turn(role: str, text: str) -> dict[str, object]:
    """role은 'user' 또는 'model'(기존 호출부 표기) — Ollama 형식(user/assistant)으로 변환한다."""
    return {"role": "assistant" if role == "model" else role, "content": text}


def generate(
    *,
    system: str,
    contents: Contents,
    max_output_tokens: int,
    temperature: float | None = None,
    response_json_schema: dict | None = None,
    # 판정·요약처럼 같은 입력에 같은 결과가 나와야 하는 호출에서 고정한다 (대화 연기는 고정하지 않는다)
    seed: int | None = None,
    # 이 호출만 쓸 모델 태그. 없으면 OLLAMA_MODEL(기본 gemma4:e4b)
    model: str | None = None,
    # 답한 뒤 모델을 그래픽 메모리에 얼마나 두나 (Ollama keep_alive). 0이면 바로 내린다 —
    # 코디포토넷이 곧바로 Stable Diffusion을 돌려야 할 때 메모리를 비워 준다. 없으면 Ollama 기본(5분)
    keep_alive: int | None = None,
    # 프리미엄 모델의 공급자. /infer만 넘긴다 (나머지 호출은 언제나 로컬)
    provider: str = "ollama",
) -> str:
    # 웹 자동 테스트(e2e)용: 모델 없이 고정된 응답을 돌려준다. 실제 품질 확인용이 아니다
    if os.environ.get("LLM_FAKE") == "1":
        return fake_llm.generate(response_json_schema)

    if provider != "ollama":
        # 프리미엄을 실제로 부를 때만 SDK를 불러온다 (불러오는 데 수 초·약 58MB. 무료 모델만 쓰면 필요 없다)
        from app.modules.runtime import premium

        if not model:
            raise HTTPException(status_code=400, detail="프리미엄 호출에는 모델 이름이 필요하다.")
        if provider == "anthropic":
            return premium.generate_claude(model=model, system=system, contents=contents)
        if provider == "xai":
            return premium.generate_grok(
                model=model,
                system=system,
                contents=contents,
                max_output_tokens=max_output_tokens,
                temperature=temperature,
            )
        raise HTTPException(status_code=400, detail="알 수 없는 공급자다.")

    # 기본 무료는 호스팅 백엔드여도 이 기기의 gemma4:e4b를 그대로 쓴다. 요약·검수처럼 모델을 비운 호출은 아래 백엔드를 따른다.
    if model == BASIC_LOCAL_TAG:
        return _generate_ollama(
            system=system,
            contents=contents,
            max_output_tokens=max_output_tokens,
            temperature=temperature,
            response_json_schema=response_json_schema,
            seed=seed,
            model=BASIC_LOCAL_TAG,
            keep_alive=keep_alive,
        )

    # 강화 무료: 키가 있으면 NVIDIA gemma-4-31b-it. 주소·모델 환경변수가 있으면 그것을 쓰고, 없으면 NVIDIA 기본값.
    # 막히면 없는 gemma4:12b 대신 기본 로컬 모델로 내려간다.
    route = _hosted_route(model)
    if route is not None:
        api_base, api_model = route
        if response_json_schema is None:
            # 글로 답하는 호출(대화 연기·월드 진행자 등)은 스트리밍으로 받아 모은다. 한 번에 받으면 답 전체가
            # LLM_API_TIMEOUT_SECONDS 안에 와야 해서, 느리지만 쓰고 있는 답도 끊고 CPU 예비로 처음부터 다시 했다
            text = "".join(
                _iter_hosted_with_fallback(
                    system=system,
                    contents=contents,
                    max_output_tokens=max_output_tokens,
                    temperature=temperature,
                    seed=seed,
                    ollama_model=_fallback_local_model(model),
                    keep_alive=keep_alive,
                    api_base=api_base,
                    api_model=api_model,
                )
            )
            if not text:
                raise HTTPException(status_code=502, detail="LLM이 빈 응답을 돌려줬다 (출력 토큰 한도 초과일 수 있다).")
            return text
        return _generate_openai_with_fallback(
            system=system,
            contents=contents,
            max_output_tokens=max_output_tokens,
            temperature=temperature,
            response_json_schema=response_json_schema,
            seed=seed,
            ollama_model=_fallback_local_model(model),
            keep_alive=keep_alive,
            api_base=api_base,
            api_model=api_model,
        )

    return _generate_ollama(
        system=system,
        contents=contents,
        max_output_tokens=max_output_tokens,
        temperature=temperature,
        response_json_schema=response_json_schema,
        seed=seed,
        model=model,
        keep_alive=keep_alive,
    )


def _generate_ollama(
    *,
    system: str,
    contents: Contents,
    max_output_tokens: int,
    temperature: float | None,
    response_json_schema: dict | None,
    seed: int | None,
    model: str | None,
    keep_alive: int | None,
) -> str:
    base_url = os.environ.get("OLLAMA_BASE_URL", DEFAULT_BASE_URL)
    model = model or os.environ.get("OLLAMA_MODEL", DEFAULT_MODEL)

    messages: list[dict[str, object]] = [{"role": "system", "content": system}, *contents]
    options: dict[str, object] = {"num_predict": max_output_tokens}
    if temperature is not None:
        options["temperature"] = temperature
    if seed is not None:
        options["seed"] = seed

    payload: dict[str, object] = {
        "model": model,
        "messages": messages,
        # 스트리밍으로 받는다. 한 번에 받으면 답이 다 만들어질 때까지 아무것도 오지 않아, 느린 서버(CPU·큰 모델)에서는
        # "아직 쓰는 중"인 답이 고정 시간 제한에 걸려 끊긴다. 스트리밍이면 제한은 "토큰 사이의 공백"에만 걸린다
        "stream": True,
        # gemma4는 thinking 모델이라 꺼 두지 않으면 num_predict를 생각 과정이 다 먹어
        # 본문이 빈 채로 잘린다("done_reason": "length")
        "think": False,
        "options": options,
    }
    if response_json_schema is not None:
        payload["format"] = response_json_schema
    if keep_alive is not None:
        payload["keep_alive"] = keep_alive

    text = "".join(_iter_ollama_pieces(base_url, model, payload))
    if not text:
        raise HTTPException(
            status_code=502,
            detail="LLM이 빈 응답을 돌려줬다 (출력 토큰 한도 초과일 수 있다).",
        )
    return text


def _seconds(name: str, default: float) -> float | None:
    """환경변수의 초 값. 0이나 음수는 '제한 없음'(None)."""
    raw = os.environ.get(name, "").strip()
    try:
        value = float(raw) if raw else default
    except ValueError:
        value = default
    return value if value > 0 else None


def ollama_timeout() -> httpx.Timeout:
    """Ollama 호출의 시간 제한.

    - 연결: 짧게(서버가 꺼져 있으면 바로 안내한다)
    - 읽기: 다음 조각이 올 때까지 기다리는 최대 시간. 첫 토큰 전에는 모델을 메모리에 올리고 프롬프트를 읽느라
      가장 오래 걸린다(CPU에서 큰 모델이면 몇 분). 기본 600초. 0이면 제한 없음
    """
    return httpx.Timeout(
        connect=_seconds("OLLAMA_CONNECT_TIMEOUT_SECONDS", 10.0),
        read=_seconds("OLLAMA_READ_TIMEOUT_SECONDS", 600.0),
        write=60.0,
        pool=60.0,
    )


def _iter_ollama_pieces(base_url: str, model: str, payload: dict[str, object]):
    """Ollama NDJSON을 조각마다 넘긴다. 모아서 한 번에 받지 않는다."""
    total_limit = _seconds("OLLAMA_TOTAL_TIMEOUT_SECONDS", 0)
    started = time.monotonic()
    try:
        with httpx.stream("POST", f"{base_url}/api/chat", json=payload, timeout=ollama_timeout()) as response:
            if response.status_code >= 400:
                detail = response.read().decode("utf-8", "replace")
                if response.status_code == 404:
                    raise HTTPException(
                        status_code=502,
                        detail=f"모델 '{model}'을 찾을 수 없다. `ollama pull {model}`로 먼저 받는다.",
                    )
                raise HTTPException(status_code=502, detail=f"LLM 호출 실패: {detail}")
            for line in response.iter_lines():
                if not line.strip():
                    continue
                try:
                    chunk = json.loads(line)
                except json.JSONDecodeError:
                    continue
                if chunk.get("error"):
                    raise HTTPException(status_code=502, detail=f"LLM 호출 실패: {chunk['error']}")
                piece = (chunk.get("message") or {}).get("content")
                if piece:
                    yield piece
                if chunk.get("done"):
                    break
                if total_limit is not None and time.monotonic() - started > total_limit:
                    raise HTTPException(status_code=504, detail="LLM 답이 상한 시간을 넘어 멈췄다.")
    except httpx.ConnectError as exc:
        raise HTTPException(
            status_code=503,
            detail=f"로컬 Ollama 서버({base_url})에 연결할 수 없다. `ollama serve`가 실행 중인지, "
            f"`ollama list`에 '{model}' 모델이 있는지 확인한다.",
        ) from exc
    except httpx.TimeoutException as exc:
        raise HTTPException(
            status_code=504,
            detail="Ollama가 오래 아무 토큰도 보내지 않아 멈췄다. 모델이 메모리에 올라와 있는지(`ollama ps`), "
            "OLLAMA_READ_TIMEOUT_SECONDS가 너무 짧지 않은지 확인한다.",
        ) from exc


def streams_locally(model: str | None, provider: str) -> bool:
    """이 호출이 로컬 Ollama 조각을 바로 넘길 수 있나. 호스팅·프리미엄은 한 덩어리다."""
    if provider != "ollama":
        return False
    if model == BASIC_LOCAL_TAG:
        return True
    if model == ENHANCED_LOCAL_TAG and _hosted_key():
        return False
    if _backend_is_openai() and model != BASIC_LOCAL_TAG:
        return False
    return True


def iter_generate(
    *,
    system: str,
    contents: Contents,
    max_output_tokens: int,
    temperature: float | None = None,
    response_json_schema: dict | None = None,
    seed: int | None = None,
    model: str | None = None,
    keep_alive: int | None = None,
    provider: str = "ollama",
):
    """로컬 모델과 호스팅 API는 토큰 조각을 그대로 넘긴다. 프리미엄·JSON 출력은 generate() 결과 한 조각이다."""
    route = _hosted_route(model) if provider == "ollama" else None
    if route is not None and response_json_schema is None and os.environ.get("LLM_FAKE") != "1":
        yield from _iter_hosted_with_fallback(
            system=system,
            contents=contents,
            max_output_tokens=max_output_tokens,
            temperature=temperature,
            seed=seed,
            ollama_model=_fallback_local_model(model),
            keep_alive=keep_alive,
            api_base=route[0],
            api_model=route[1],
        )
        return
    if streams_locally(model, provider) and os.environ.get("LLM_FAKE") != "1":
        base_url = os.environ.get("OLLAMA_BASE_URL", DEFAULT_BASE_URL)
        tag = model or os.environ.get("OLLAMA_MODEL", DEFAULT_MODEL)
        messages: list[dict[str, object]] = [{"role": "system", "content": system}, *contents]
        options: dict[str, object] = {"num_predict": max_output_tokens}
        if temperature is not None:
            options["temperature"] = temperature
        if seed is not None:
            options["seed"] = seed
        payload: dict[str, object] = {
            "model": tag,
            "messages": messages,
            "stream": True,
            "think": False,
            "options": options,
        }
        if response_json_schema is not None:
            payload["format"] = response_json_schema
        if keep_alive is not None:
            payload["keep_alive"] = keep_alive
        yield from _iter_ollama_pieces(base_url, tag, payload)
        return
    text = generate(
        system=system,
        contents=contents,
        max_output_tokens=max_output_tokens,
        temperature=temperature,
        response_json_schema=response_json_schema,
        seed=seed,
        model=model,
        keep_alive=keep_alive,
        provider=provider,
    )
    if text:
        yield text


def warm_up() -> None:
    """기동할 때 기본 대화 모델을 메모리에 올려 둔다(첫 답이 모델 읽기로 늦어지는 것을 막는다).

    OLLAMA_WARMUP=1일 때만. 실패해도 서비스 기동은 막지 않는다. keep_alive는 Ollama 서버의 OLLAMA_KEEP_ALIVE를 따른다
    """
    if os.environ.get("OLLAMA_WARMUP") != "1" or os.environ.get("LLM_FAKE") == "1":
        return
    base_url = os.environ.get("OLLAMA_BASE_URL", DEFAULT_BASE_URL)
    models = os.environ.get("OLLAMA_WARMUP_MODELS") or os.environ.get("OLLAMA_MODEL", DEFAULT_MODEL)
    for model in [m.strip() for m in models.split(",") if m.strip()]:
        try:
            # 빈 prompt로 부르면 Ollama는 모델만 올리고 바로 답한다
            httpx.post(f"{base_url}/api/generate", json={"model": model}, timeout=ollama_timeout())
        except httpx.HTTPError:
            pass


# ---- 무료 호스팅 API (OpenAI 호환) ----------------------------------------------------------

# 한도 초과·서버 오류·시간 초과·연결 불가: 폴백이 켜져 있으면 Ollama로 넘어갈 수 있는 실패
_RETRYABLE_STATUS = {408, 425, 429, 500, 502, 503, 504}
# 키 만료·결제·모델 접근 거부: 사용자 잘못이 아니라 서버 설정 문제다. 사용자가 기다리는 답이면 예비로 대신 답하고,
# 원인은 서버 로그에 남긴다(2026-11-11 배포에서 "LLM 호출 실패"가 그대로 사용자에게 보인 일)
_CONFIG_STATUS = {401, 402, 403, 404}

logger = logging.getLogger("codicomperchat.llm")


class _ApiUnavailable(Exception):
    """호스팅 API가 지금 답하지 못한다(한도·서버·시간). 폴백 대상."""

    def __init__(self, detail: str, status_code: int = 503):
        super().__init__(detail)
        self.detail = detail
        self.status_code = status_code


def _hosted_key() -> str:
    return os.environ.get("LLM_API_KEY", "").strip() or os.environ.get("NVIDIA_API_KEY", "").strip()


def _backend_is_openai() -> bool:
    return os.environ.get("LLM_BACKEND", "ollama").strip().lower() == "openai"


def enhanced_uses_cloud(model: str | None) -> bool:
    """강화 태그이고 호스팅 키가 있으면 답이 기기 밖으로 나간다."""
    return model == ENHANCED_LOCAL_TAG and bool(_hosted_key())


def _hosted_route(model: str | None) -> tuple[str | None, str | None] | None:
    """이 모델 요청이 호스팅 API로 가면 (주소, 모델), 로컬 Ollama면 None. 주소·모델이 None이면 환경변수를 쓴다."""
    if model == BASIC_LOCAL_TAG:
        return None
    if model == ENHANCED_LOCAL_TAG and _hosted_key():
        return (
            os.environ.get("LLM_API_BASE", "").strip() or NVIDIA_API_BASE,
            os.environ.get("LLM_API_MODEL", "").strip() or NVIDIA_API_MODEL,
        )
    if _backend_is_openai():
        return (None, None)
    return None


def _fallback_allowed() -> bool:
    """호스팅이 막혔을 때 CPU 예비로 내려가도 되나. 배경 작업(정리·기억)은 내려가지 않고 다음 기회로 미룬다."""
    return os.environ.get("LLM_FALLBACK_OLLAMA") == "1" and not request_priority.is_background()


# CPU 예비로 내려갈 때 가볍게: 최근 대화를 줄이고 출력을 짧게. ARM 2코어에서는 프롬프트를 읽는 시간이 대부분이라
# 긴 대화 기록을 그대로 넘기면 몇 분이 걸린다(2026-11-11 사용자 보고: 한 턴 3분 53초)
def _fallback_turns() -> int:
    raw = os.environ.get("LLM_FALLBACK_MAX_TURNS", "").strip()
    return int(raw) if raw.isdigit() and int(raw) > 0 else 8


def _fallback_tokens(requested: int) -> int:
    raw = os.environ.get("LLM_FALLBACK_MAX_TOKENS", "").strip()
    cap = int(raw) if raw.isdigit() and int(raw) > 0 else 320
    return min(requested, cap)


def _hosted_timeout() -> httpx.Timeout:
    """호스팅 스트리밍의 시간 제한. 읽기는 '다음 조각까지'의 공백이다(첫 조각 전에는 프롬프트를 읽는 시간)."""
    return httpx.Timeout(
        connect=_seconds("LLM_API_CONNECT_TIMEOUT_SECONDS", 10.0),
        read=_seconds("LLM_API_READ_TIMEOUT_SECONDS", 40.0),
        write=30.0,
        pool=30.0,
    )


def _iter_openai_pieces(
    *,
    system: str,
    contents: Contents,
    max_output_tokens: int,
    temperature: float | None,
    seed: int | None,
    api_base: str | None,
    api_model: str | None,
):
    """OpenAI 호환 API를 스트리밍(SSE)으로 받아 조각마다 넘긴다.

    첫 조각 전에 막히면(한도·서버 오류·연결·시간) _ApiUnavailable — 예비로 넘어갈 수 있다.
    조각을 이미 넘긴 뒤 끊기면 HTTPException — 화면에 반쯤 나간 답을 예비로 바꿔 쓰지 않는다.
    """
    base = (api_base if api_base is not None else os.environ.get("LLM_API_BASE", "")).rstrip("/")
    api_model = api_model if api_model is not None else os.environ.get("LLM_API_MODEL", "")
    if not base or not api_model:
        raise HTTPException(status_code=500, detail="LLM_BACKEND=openai에는 LLM_API_BASE와 LLM_API_MODEL이 필요하다.")
    payload: dict[str, object] = {
        "model": api_model,
        "messages": [{"role": "system", "content": system}, *contents],
        "max_tokens": max_output_tokens,
        "stream": True,
    }
    if temperature is not None:
        payload["temperature"] = temperature
    if seed is not None:
        payload["seed"] = seed
    headers = {"Content-Type": "application/json", "Accept": "text/event-stream"}
    key = _hosted_key()
    if key:
        headers["Authorization"] = f"Bearer {key}"
    total_limit = _seconds("LLM_API_TOTAL_TIMEOUT_SECONDS", 150.0)
    started = time.monotonic()
    sent = False

    def fail(detail: str, status: int) -> Exception:
        return HTTPException(status_code=502 if status >= 500 else status, detail=detail) if sent else _ApiUnavailable(detail, status)

    try:
        with httpx.stream("POST", f"{base}/chat/completions", json=payload, headers=headers, timeout=_hosted_timeout()) as response:
            if response.status_code in _RETRYABLE_STATUS:
                reason = "하루·분당 한도를 넘었다" if response.status_code == 429 else f"서버 오류({response.status_code})"
                raise _ApiUnavailable(f"무료 AI API가 지금 답하지 못한다: {reason}.", 503 if response.status_code == 429 else 502)
            if response.status_code >= 400:
                detail = response.read().decode("utf-8", "replace")[:300]
                if response.status_code in _CONFIG_STATUS:
                    raise _ApiUnavailable(f"LLM 호출 실패({response.status_code}): {detail}", 502)
                raise HTTPException(status_code=502, detail=f"LLM 호출 실패: {detail}")
            for line in response.iter_lines():
                line = line.strip()
                if not line.startswith("data:"):
                    continue
                data = line[5:].strip()
                if data == "[DONE]":
                    break
                try:
                    chunk = json.loads(data)
                except json.JSONDecodeError:
                    continue
                choices = chunk.get("choices") or []
                piece = ((choices[0] or {}).get("delta") or {}).get("content") if choices else None
                if piece:
                    sent = True
                    yield piece
                if total_limit is not None and time.monotonic() - started > total_limit:
                    raise fail("무료 AI API의 답이 상한 시간을 넘어 멈췄다.", 504)
    except httpx.TimeoutException as exc:
        raise fail("무료 AI API가 오래 아무것도 보내지 않아 멈췄다.", 504) from exc
    except httpx.HTTPError as exc:
        raise fail(f"무료 AI API({base})에 연결할 수 없다.", 503) from exc


def _iter_hosted_with_fallback(
    *,
    system: str,
    contents: Contents,
    max_output_tokens: int,
    temperature: float | None,
    seed: int | None,
    ollama_model: str | None,
    keep_alive: int | None,
    api_base: str | None,
    api_model: str | None,
):
    """호스팅 스트리밍 → 첫 조각 전에 막히면 가벼운 CPU 예비(사용자가 기다리는 답일 때만)."""
    try:
        yield from _iter_openai_pieces(
            system=system,
            contents=contents,
            max_output_tokens=max_output_tokens,
            temperature=temperature,
            seed=seed,
            api_base=api_base,
            api_model=api_model,
        )
        return
    except _ApiUnavailable as exc:
        if not _fallback_allowed():
            logger.warning("호스팅 API 실패, 예비 없이 오류로 돌려준다: %s", exc.detail)
            raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
        logger.warning("호스팅 API 실패, CPU 예비로 대신 답한다: %s", exc.detail)
    base_url = os.environ.get("OLLAMA_BASE_URL", DEFAULT_BASE_URL)
    tag = ollama_model or os.environ.get("OLLAMA_MODEL", DEFAULT_MODEL)
    options: dict[str, object] = {"num_predict": _fallback_tokens(max_output_tokens)}
    if temperature is not None:
        options["temperature"] = temperature
    if seed is not None:
        options["seed"] = seed
    payload: dict[str, object] = {
        "model": tag,
        "messages": [{"role": "system", "content": system}, *contents[-_fallback_turns():]],
        "stream": True,
        "think": False,
        "options": options,
    }
    if keep_alive is not None:
        payload["keep_alive"] = keep_alive
    yield from _iter_ollama_pieces(base_url, tag, payload)


def _fallback_local_model(requested: str | None) -> str | None:
    """예비 Ollama는 서버에 없는 강화 태그를 찾지 않고 기본 모델을 쓴다."""
    if requested == ENHANCED_LOCAL_TAG:
        return os.environ.get("OLLAMA_MODEL", BASIC_LOCAL_TAG)
    return requested


def _generate_openai_with_fallback(
    *,
    system: str,
    contents: Contents,
    max_output_tokens: int,
    temperature: float | None,
    response_json_schema: dict | None,
    seed: int | None,
    ollama_model: str | None,
    keep_alive: int | None,
    api_base: str | None = None,
    api_model: str | None = None,
) -> str:
    try:
        return _generate_openai(
            system=system,
            contents=contents,
            max_output_tokens=max_output_tokens,
            temperature=temperature,
            response_json_schema=response_json_schema,
            seed=seed,
            api_base=api_base,
            api_model=api_model,
        )
    except _ApiUnavailable as exc:
        if not _fallback_allowed():
            logger.warning("호스팅 API 실패, 예비 없이 오류로 돌려준다: %s", exc.detail)
            raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
        logger.warning("호스팅 API 실패, CPU 예비로 대신 답한다: %s", exc.detail)
        # 예비 모델로 대신 답한다. 예비도 안 되면 그 오류(연결 불가 등)가 그대로 나간다
        return _generate_ollama(
            system=system,
            contents=contents,
            max_output_tokens=max_output_tokens,
            temperature=temperature,
            response_json_schema=response_json_schema,
            seed=seed,
            model=ollama_model,
            keep_alive=keep_alive,
        )


def _strip_fence(text: str) -> str:
    """모델이 JSON을 ```json … ```로 감싸 보내면 벗긴다."""
    t = text.strip()
    if t.startswith("```"):
        t = t.split("\n", 1)[1] if "\n" in t else ""
        if t.rstrip().endswith("```"):
            t = t.rstrip()[:-3]
    return t.strip()


def _generate_openai(
    *,
    system: str,
    contents: Contents,
    max_output_tokens: int,
    temperature: float | None,
    response_json_schema: dict | None,
    seed: int | None,
    api_base: str | None = None,
    api_model: str | None = None,
) -> str:
    base = (api_base if api_base is not None else os.environ.get("LLM_API_BASE", "")).rstrip("/")
    key = _hosted_key()
    api_model = api_model if api_model is not None else os.environ.get("LLM_API_MODEL", "")
    if not base or not api_model:
        raise HTTPException(status_code=500, detail="LLM_BACKEND=openai에는 LLM_API_BASE와 LLM_API_MODEL이 필요하다.")

    if response_json_schema is not None:
        # 모든 호환 API가 구조화 출력(json_schema)을 받는 것은 아니라서, 스키마를 지시문에도 적어 둔다
        system = (
            f"{system}\n\n[출력 형식] 아래 JSON 스키마를 따르는 JSON 객체 하나만 출력한다. 설명·코드블록 없이.\n"
            f"{json.dumps(response_json_schema, ensure_ascii=False)}"
        )
    payload: dict[str, object] = {
        "model": api_model,
        "messages": [{"role": "system", "content": system}, *contents],
        "max_tokens": max_output_tokens,
        "stream": False,
    }
    if temperature is not None:
        payload["temperature"] = temperature
    if seed is not None:
        payload["seed"] = seed
    with_format = dict(payload)
    if response_json_schema is not None:
        with_format["response_format"] = {
            "type": "json_schema",
            "json_schema": {"name": "reply", "schema": response_json_schema, "strict": False},
        }

    headers = {"Content-Type": "application/json"}
    if key:
        headers["Authorization"] = f"Bearer {key}"
    timeout = _seconds("LLM_API_TIMEOUT_SECONDS", 120.0)

    def post(body: dict[str, object]) -> httpx.Response:
        try:
            return httpx.post(f"{base}/chat/completions", json=body, headers=headers, timeout=timeout)
        except httpx.TimeoutException as exc:
            raise _ApiUnavailable("무료 AI API의 응답이 늦어 멈췄다.", 504) from exc
        except httpx.HTTPError as exc:
            raise _ApiUnavailable(f"무료 AI API({base})에 연결할 수 없다.", 503) from exc

    response = post(with_format)
    # 구조화 출력을 지원하지 않는 모델·API면 400이 온다: 지시문만으로 한 번 더
    if response.status_code == 400 and "response_format" in with_format:
        response = post(payload)

    if response.status_code in _RETRYABLE_STATUS:
        reason = "하루·분당 한도를 넘었다" if response.status_code == 429 else f"서버 오류({response.status_code})"
        raise _ApiUnavailable(f"무료 AI API가 지금 답하지 못한다: {reason}.", 503 if response.status_code == 429 else 502)
    if response.status_code >= 400:
        if response.status_code in _CONFIG_STATUS:
            raise _ApiUnavailable(f"LLM 호출 실패({response.status_code}): {response.text[:300]}", 502)
        raise HTTPException(status_code=502, detail=f"LLM 호출 실패: {response.text[:300]}")

    try:
        text = response.json()["choices"][0]["message"]["content"] or ""
    except (KeyError, IndexError, TypeError, ValueError):
        text = ""
    if response_json_schema is not None:
        text = _strip_fence(text)
    if not text:
        raise HTTPException(status_code=502, detail="LLM이 빈 응답을 돌려줬다 (출력 토큰 한도 초과일 수 있다).")
    return text
