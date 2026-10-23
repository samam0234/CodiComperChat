"""LLM_FAKE=1일 때 Ollama 대신 쓰는 가짜 LLM. 웹 자동 테스트(e2e)가 모델 없이 빠르고 같은 결과로 돌게 한다.

실제 품질을 확인하는 용도가 아니다(그건 evals). 요청이 JSON 스키마를 주면 그 모양에 맞는 고정값을,
스키마가 없으면 존댓말 한 줄을 돌려준다. 판정류는 "문제 없음"으로 나오게 해 3턴 테스트가 통과한다.
"""

import json
import os
import threading
import time

REPLY = "네, 알겠어요. 오늘도 천천히 이야기해 봐요."

# 속성 이름별 고정값 (스키마가 요구하는 이름에 맞춘다)
BY_NAME: dict[str, object] = {
    "text": "테스트 초안이에요. 설정에 맞게 고쳐 쓰세요.",
    "items": ["테스트 항목"],
    "memories": ["민준은 시험 때문에 힘들어한다"],
    "suggestions": ["오늘은 어떠셨어요?", "그건 조금 더 이야기해 줄래요?", "저는 괜찮아요, 고마워요."],
    "brief": "민준이 속마음을 털어놓았고 둘은 다음 만남을 약속했다.",
    "relationDelta": 2,
    "relationReason": "속마음을 털어놓고 위로를 나눴다",
    "hooksOpen": ["다음 주에 다시 만나기로 했다"],
    "nextPressure": "다음 만남",
    "invented": False,
    "note": "",
    "notes": [],
    # 오퍼레이션
    "innerVoice": "사실은 조금 설레. 내색하지 않으려고 애쓰는 중이야.",
    "feeling": "설렘",
    "aboutUser": "오늘따라 믿음직해 보인다.",
    "title": "비 오는 날의 손님",
    "mood": "포근함",
    "body": "오늘은 비가 왔다. 민준이 찾아와서 한참 이야기를 나눴다. 괜히 마음이 놓이는 하루였다.",
    "posts": [
        {
            "author": "골목고양이",
            "title": "카페 사장님 오늘도 친절하심",
            "body": "비 와서 들렀는데 따뜻한 차 주셨어요.",
            "comments": [{"author": "익명", "body": "인정합니다"}],
        },
        {"author": "퇴근길직장인", "title": "요즘 동네 분위기 좋네요", "body": "다들 인사도 잘 하시고요.", "comments": []},
        {
            "author": "익명",
            "title": "우산 잃어버리신 분",
            "body": "정류장에 파란 우산 있어요.",
            "comments": [{"author": "동네주민", "body": "제 거 같아요!"}],
        },
    ],
    "comments": [{"author": "골목고양이", "body": "좋은 글이네요"}, {"author": "익명", "body": "공감해요"}],
    # 코디포토넷: 장면 → 영어 태그
    "tags": "1girl, cafe, rainy window, warm smile, holding tea cup",
}


def _value(name: str, spec: dict) -> object:
    if name in BY_NAME:
        return BY_NAME[name]
    kind = spec.get("type")
    if kind == "boolean":
        return False
    if kind == "integer":
        return 0
    if kind == "array":
        return []
    return ""


# 부하 측정용: 실제 모델처럼 느리고 한 번에 하나씩만 처리하는 상황을 흉내 낸다
#   FAKE_LLM_DELAY_MS=2000  호출 하나에 걸리는 시간
#   FAKE_LLM_SERIAL=1       여러 요청이 와도 한 번에 하나만 처리 (로컬 Ollama 한 대처럼)
_SERIAL_LOCK = threading.Lock()


def _simulate_latency() -> None:
    delay = float(os.environ.get("FAKE_LLM_DELAY_MS", "0")) / 1000
    if delay <= 0:
        return
    if os.environ.get("FAKE_LLM_SERIAL") == "1":
        with _SERIAL_LOCK:
            time.sleep(delay)
    else:
        time.sleep(delay)


def generate(response_json_schema: dict | None) -> str:
    _simulate_latency()
    if response_json_schema is None:
        return REPLY
    props: dict = response_json_schema.get("properties", {})
    return json.dumps({name: _value(name, spec) for name, spec in props.items()}, ensure_ascii=False)
