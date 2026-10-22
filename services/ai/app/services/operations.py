"""오퍼레이션(대화 플러그인): 캐릭터의 목소리로 대사 말고 다른 글을 쓴다.

캐릭터 연기용 시스템 프롬프트(inference._build_system_prompt)와 최근 대화를 그대로 쓰고,
마지막에 "작가 지시"를 괄호로 넣어 이번에는 대답 대신 무엇을 쓸지 정한다(규칙 6: 괄호는 장면 지시).
설정에 없는 비밀·과거를 새로 만들지 않게 매번 못 박는다 — 비밀 원문은 애초에 Nest가 보내지 않는다.
"""

import json

from fastapi import HTTPException

from app.schemas.context import ContextSlice
from app.schemas.operations import DiaryRequest, DiaryResponse, MindRequest, MindResponse
from app.services import inference, llm

NO_INVENTION = "설정과 대화에 없는 비밀·과거·가족·사건은 새로 만들지 않는다. 대화에서 실제로 있었던 일과 지금 감정만 쓴다."


def _user_name(context: ContextSlice) -> str:
    return context.user_persona.name if context.user_persona else "유저"


def _character_json(
    context: ContextSlice, instruction: str, schema: dict, *, max_tokens: int = 900, temperature: float = 0.8
) -> dict:
    """캐릭터 목소리로 JSON 하나를 받는다. 형식이 틀리면 502."""
    name = _user_name(context)
    system = inference._fill_user(inference._build_system_prompt(context), name)
    contents = [
        {**c, "content": inference._fill_user(str(c["content"]), name)}
        for c in inference._build_messages(context, f"(작가 지시 — 유저의 말이 아니다. {instruction})")
    ]
    raw = llm.generate(
        system=system,
        contents=contents,
        max_output_tokens=max_tokens,
        temperature=temperature,
        response_json_schema=schema,
    )
    try:
        data = json.loads(raw)
    except ValueError as exc:
        raise HTTPException(status_code=502, detail="오퍼레이션 결과 형식이 올바르지 않다") from exc
    if not isinstance(data, dict):
        raise HTTPException(status_code=502, detail="오퍼레이션 결과 형식이 올바르지 않다")
    return data


def _text(data: dict, key: str, max_len: int, *, required: bool = True) -> str:
    value = data.get(key)
    text = value.strip()[:max_len] if isinstance(value, str) else ""
    if required and not text:
        raise HTTPException(status_code=502, detail=f"오퍼레이션 결과에 '{key}'가 비어 있다")
    return text


def mind(request: MindRequest) -> MindResponse:
    context = request.context
    character = context.character.name
    user = _user_name(context)
    data = _character_json(
        context,
        f"이번에는 대답하지 않는다. 바로 지금 이 장면에서 {character}의 머릿속을 엿본다. "
        f"innerVoice: {character}의 1인칭 속마음 독백 3~5문장. 겉으로 한 말과 달라도 되고, 말투는 {character} 그대로. "
        f"feeling: 지금 감정을 짧은 말 하나로(예: 설렘, 불안, 서운함). "
        f"aboutUser: {user}에 대해 지금 드는 생각 한 문장. {NO_INVENTION}",
        {
            "type": "object",
            "properties": {
                "innerVoice": {"type": "string"},
                "feeling": {"type": "string"},
                "aboutUser": {"type": "string"},
            },
            "required": ["innerVoice", "feeling", "aboutUser"],
        },
    )
    return MindResponse(
        inner_voice=_text(data, "innerVoice", 800),
        feeling=_text(data, "feeling", 40),
        about_user=_text(data, "aboutUser", 300),
    )


def diary(request: DiaryRequest) -> DiaryResponse:
    context = request.context
    character = context.character.name
    user = _user_name(context)
    data = _character_json(
        context,
        f"이번에는 대답하지 않는다. 오늘 밤 {character}가 혼자 쓰는 일기를 쓴다. "
        f"최근 대화에서 {user}와 실제로 있었던 일을 {character}의 입장에서 돌아보고, 그때 느낀 기분을 솔직하게 적는다. "
        f"title: 일기 제목(20자 안팎). mood: 오늘 기분을 짧은 말 하나로. "
        f"body: {character}의 1인칭 일기 본문 6~10문장, 말투는 {character} 그대로. 날짜는 쓰지 않는다. "
        f"대화에 없던 사건을 지어내지 않는다. {NO_INVENTION}",
        {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "mood": {"type": "string"},
                "body": {"type": "string"},
            },
            "required": ["title", "mood", "body"],
        },
        max_tokens=1400,
    )
    return DiaryResponse(
        title=_text(data, "title", 60),
        mood=_text(data, "mood", 30),
        body=_text(data, "body", 2000),
    )
