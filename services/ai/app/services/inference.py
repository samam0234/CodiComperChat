import os

from fastapi import HTTPException

from app.schemas.context import ContextSlice
from app.schemas.infer import InferRequest, InferResponse

try:
    import anthropic
except ImportError:  # pragma: no cover - requirements.txt에 있어야 정상
    anthropic = None  # type: ignore[assignment]

DEFAULT_MODEL = "claude-sonnet-5"
MAX_TOKENS = 600


def _build_system_prompt(context: ContextSlice) -> str:
    """캐릭터 카드(ContextSlice)를 시스템 프롬프트로 조립한다 (기획서 13.3장).

    미해금 비밀은 Nest 단계에서 애초에 안 담아 보낸다 — 여기서 가릴 게 아니라
    받는 쪽에 없어야 한다. director_note에는 Nest가 프리텍스트 카드 원문을
    구조화 손실 없이 그대로 넣는다.
    """
    character = context.character
    speech = character.speech
    honorific_label = {
        "banmal": "반말",
        "jondae": "존댓말",
        "mix": "존댓말과 반말을 섞어 씀",
    }[speech.honorific]

    lines = [
        f"당신은 대화형 캐릭터 '{character.name}'입니다. 아래 설정을 벗어나지 않고 "
        "캐릭터로만 답합니다. 자신이 AI/모델/어시스턴트라는 사실을 언급하지 않고, "
        "설명충처럼 굴지 않습니다(질문마다 백과사전식으로 늘어놓지 않는다).",
        f"역할: {character.role}",
        f"한 줄 요약: {character.summary}",
        f"유저를 부르는 방식: {speech.address_as}",
        f"말투: {honorific_label}",
    ]
    if speech.habits:
        lines.append("말투 습관: " + " / ".join(speech.habits))
    if speech.forbidden:
        lines.append("말투에서 금지: " + ", ".join(speech.forbidden))
    if character.never_do:
        lines.append("캐릭터가 절대 하지 않는 것: " + ", ".join(character.never_do))
    if character.locked_secret_topics:
        lines.append(
            "다음 화제는 아직 밝혀지지 않은 비밀이다. 유저가 먼저 캐묻지 않는 한 "
            "스스로 꺼내지 않는다: " + ", ".join(character.locked_secret_topics)
        )
    if character.unlocked_secrets:
        lines.append("이미 밝혀진 비밀: " + ", ".join(character.unlocked_secrets))

    if context.state.relations:
        rel = ", ".join(
            f"{axis.name} {axis.value}({axis.reason})" for axis in context.state.relations
        )
        lines.append(f"현재 관계 상태: {rel}")
    if context.state.open_hooks:
        hooks = ", ".join(hook.text for hook in context.state.open_hooks)
        lines.append(f"아직 회수하지 않은 복선: {hooks}")

    if context.active_lore:
        lore = "\n".join(f"- {entry.keyword}: {entry.content}" for entry in context.active_lore)
        lines.append("참고할 설정(로어):\n" + lore)

    if context.retrieved_memories:
        memories = "\n".join(f"- {m.text}" for m in context.retrieved_memories)
        lines.append("과거 세션에서 떠올린 기억:\n" + memories)

    if context.director_note:
        lines.append("추가 설정(카드 원문):\n" + context.director_note)

    return "\n\n".join(lines)


def _build_messages(context: ContextSlice, user_turn: str) -> list[dict[str, str]]:
    messages = [
        {"role": "user" if turn.role == "user" else "assistant", "content": turn.text}
        for turn in context.recent_turns
    ]
    messages.append({"role": "user", "content": user_turn})
    return messages


def run(request: InferRequest) -> InferResponse:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if anthropic is None or not api_key:
        raise HTTPException(
            status_code=503,
            detail=(
                "호스티드 LLM이 연결되지 않았다. ANTHROPIC_API_KEY 환경변수를 설정하면 "
                "이 자리에서 실제로 캐릭터가 응답한다 (기획서 15장 열린 항목: 호스티드 LLM 벤더)."
            ),
        )

    client = anthropic.Anthropic(api_key=api_key)
    system_prompt = _build_system_prompt(request.context)
    messages = _build_messages(request.context, request.user_turn)
    model = os.environ.get("ANTHROPIC_MODEL", DEFAULT_MODEL)

    try:
        response = client.messages.create(
            model=model,
            max_tokens=MAX_TOKENS,
            system=system_prompt,
            messages=messages,
        )
    except anthropic.APIError as exc:
        raise HTTPException(status_code=502, detail=f"LLM 호출 실패: {exc}") from exc

    text = "".join(
        block.text for block in response.content if block.type == "text"
    )
    return InferResponse(reply=text)
