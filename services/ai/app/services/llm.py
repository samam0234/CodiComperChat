"""로컬 Ollama 호출 공통부. 서버 상태 확인·오류 변환을 한곳에서 한다."""

import os

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
) -> str:
    # 웹 자동 테스트(e2e)용: 모델 없이 고정된 응답을 돌려준다. 실제 품질 확인용이 아니다
    if os.environ.get("LLM_FAKE") == "1":
        return fake_llm.generate(response_json_schema)

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
        "stream": False,
        # gemma4는 thinking 모델이라 꺼 두지 않으면 num_predict를 생각 과정이 다 먹어
        # 본문이 빈 채로 잘린다("done_reason": "length")
        "think": False,
        "options": options,
    }
    if response_json_schema is not None:
        payload["format"] = response_json_schema
    if keep_alive is not None:
        payload["keep_alive"] = keep_alive

    try:
        response = httpx.post(f"{base_url}/api/chat", json=payload, timeout=120.0)
        response.raise_for_status()
    except httpx.ConnectError as exc:
        raise HTTPException(
            status_code=503,
            detail=f"로컬 Ollama 서버({base_url})에 연결할 수 없다. `ollama serve`가 실행 중인지, "
            f"`ollama list`에 '{model}' 모델이 있는지 확인한다.",
        ) from exc
    except httpx.HTTPStatusError as exc:
        detail = exc.response.text
        if exc.response.status_code == 404:
            raise HTTPException(
                status_code=502,
                detail=f"모델 '{model}'을 찾을 수 없다. `ollama pull {model}`로 먼저 받는다.",
            ) from exc
        raise HTTPException(status_code=502, detail=f"LLM 호출 실패: {detail}") from exc

    text = response.json().get("message", {}).get("content", "")
    if not text:
        raise HTTPException(
            status_code=502,
            detail="LLM이 빈 응답을 돌려줬다 (출력 토큰 한도 초과일 수 있다).",
        )
    return text
