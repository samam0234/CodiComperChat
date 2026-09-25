"""Gemini 호출 공통부. 키 확인·재시도·오류 변환을 한곳에서 한다."""

import os

from fastapi import HTTPException

try:
    from google import genai
    from google.genai import errors as genai_errors
    from google.genai import types
except ImportError:  # pragma: no cover - requirements.txt에 있어야 정상
    genai = genai_errors = types = None  # type: ignore[assignment]

DEFAULT_MODEL = "gemini-3-flash"

Contents = list[dict[str, object]]


def turn(role: str, text: str) -> dict[str, object]:
    """role은 Gemini 규칙대로 'user' 또는 'model'."""
    return {"role": role, "parts": [{"text": text}]}


def generate(
    *,
    system: str,
    contents: Contents,
    max_output_tokens: int,
    temperature: float | None = None,
    response_json_schema: dict | None = None,
) -> str:
    api_key = os.environ.get("GEMINI_API_KEY")
    if genai is None or not api_key:
        raise HTTPException(
            status_code=503,
            detail="호스티드 LLM이 연결되지 않았다. GEMINI_API_KEY 환경변수를 설정하면 실제로 응답한다.",
        )

    # 신규 모델은 수요 급증으로 503이 간헐적으로 난다 — 한 턴이 바로 실패하지 않게 짧게 재시도한다.
    # 429(요청 한도)는 재시도하면 한도만 더 깎이므로 재시도 대상에서 뺀다
    client = genai.Client(
        api_key=api_key,
        http_options=types.HttpOptions(
            retry_options=types.HttpRetryOptions(
                attempts=4,
                initial_delay=1.0,
                max_delay=8.0,
                http_status_codes=[500, 503, 504],
            )
        ),
    )

    # Gemini 3.x는 thinking 토큰도 출력 한도에 포함된다 — 짧은 답에는 LOW로 충분하고 잘림도 막는다
    config = types.GenerateContentConfig(
        system_instruction=system,
        max_output_tokens=max_output_tokens,
        temperature=temperature,
        thinking_config=types.ThinkingConfig(thinking_level=types.ThinkingLevel.LOW),
    )
    if response_json_schema is not None:
        config.response_mime_type = "application/json"
        config.response_json_schema = response_json_schema

    try:
        response = client.models.generate_content(
            model=os.environ.get("GEMINI_MODEL", DEFAULT_MODEL),
            contents=contents,
            config=config,
        )
    except genai_errors.APIError as exc:
        if exc.code == 429:
            raise HTTPException(
                status_code=429,
                detail="지금 요청이 몰려 잠시 쉬는 중이에요. 1분쯤 뒤에 다시 시도해 주세요.",
            ) from exc
        raise HTTPException(status_code=502, detail=f"LLM 호출 실패: {exc}") from exc

    if not response.text:
        raise HTTPException(
            status_code=502,
            detail="LLM이 빈 응답을 돌려줬다 (안전 필터 차단이거나 출력 토큰 한도 초과일 수 있다).",
        )
    return response.text
