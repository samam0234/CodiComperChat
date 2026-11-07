"""대화 모델 호출 공통부. 서버 상태 확인·오류 변환을 한곳에서 한다.

백엔드 두 가지 (LLM_BACKEND):
- ollama(기본): 로컬 Ollama. GPU 기계나 CPU 서버에서 직접 돌린다
- openai: OpenAI 호환 호스팅 API (NVIDIA NIM, Google AI Studio의 호환 주소, OpenRouter 등). 무료 티어로 24시간 PC 없이 쓴다.
  LLM_FALLBACK_OLLAMA=1이면 한도 초과(429)·서버 오류·시간 초과 때 Ollama로 대신 답한다
"""

import json
import os
import time

import httpx
from fastapi import HTTPException

from app.services import fake_llm

# 로컬에 pull된 모델 태그. 확인: `ollama list`
DEFAULT_MODEL = "gemma4:e4b"
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
        from app.services import premium

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

    if os.environ.get("LLM_BACKEND", "ollama").strip().lower() == "openai":
        return _generate_openai_with_fallback(
            system=system,
            contents=contents,
            max_output_tokens=max_output_tokens,
            temperature=temperature,
            response_json_schema=response_json_schema,
            seed=seed,
            ollama_model=model,
            keep_alive=keep_alive,
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

    text = _stream_chat(base_url, model, payload)
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


def _stream_chat(base_url: str, model: str, payload: dict[str, object]) -> str:
    parts: list[str] = []
    # 답 전체에 거는 상한(선택). 기본은 없음: 토큰이 계속 나오면 끝까지 기다린다
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
                    parts.append(piece)
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
    return "".join(parts)


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


class _ApiUnavailable(Exception):
    """호스팅 API가 지금 답하지 못한다(한도·서버·시간). 폴백 대상."""

    def __init__(self, detail: str, status_code: int = 503):
        super().__init__(detail)
        self.detail = detail
        self.status_code = status_code


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
) -> str:
    try:
        return _generate_openai(
            system=system,
            contents=contents,
            max_output_tokens=max_output_tokens,
            temperature=temperature,
            response_json_schema=response_json_schema,
            seed=seed,
        )
    except _ApiUnavailable as exc:
        if os.environ.get("LLM_FALLBACK_OLLAMA") != "1":
            raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc
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
) -> str:
    base = os.environ.get("LLM_API_BASE", "").rstrip("/")
    key = os.environ.get("LLM_API_KEY", "")
    api_model = os.environ.get("LLM_API_MODEL", "")
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
