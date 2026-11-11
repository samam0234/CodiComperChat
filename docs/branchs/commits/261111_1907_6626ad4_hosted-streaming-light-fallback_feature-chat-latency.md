# 호스팅 답을 스트리밍으로 받아 CPU 예비로 떨어지지 않게 하다

| 항목 | 내용 |
|------|------|
| Subject | `fix(ai): 호스팅 답을 스트리밍으로 받아 CPU 예비로 떨어지지 않게 하다` |
| Full SHA | `6626ad4aa139c72a585f04037b9da3cf749ad992` |
| Short SHA | `6626ad4` |
| Branch | `feature/chat-latency` |
| Parent | `2a4d0f3` |
| Date | 2026-11-11 19:07:48 +0900 |

## 주 내용

호스팅 모델의 글 답을 스트리밍으로 받아, 느리게 쓰는 답이 45초에 끊겨 무거운 CPU 예비로 넘어가던 길을 막았다.

## 상세

### 배경

배포(Oracle A1 2 OCPU, 대화는 NVIDIA 호스팅 `gemma-4-31b-it`, 예비는 CPU `gemma4:e4b`)에서 1:1 한 턴이 약 3분 53초였다. 호스팅 호출이 `stream: False`라 `LLM_API_TIMEOUT_SECONDS` 45초가 답 전체에 걸렸고, 넘기면 같은 긴 프롬프트(최근 대화 30개 안팎)를 CPU가 처음부터 읽었다. 배경 작업(기억·요약·알아채기)도 같은 예비로 내려가 하나뿐인 CPU 자리를 차지할 수 있었다.

### 변경 범위

- `llm.py`: `_iter_openai_pieces`가 SSE로 조각을 받는다. 연결 10초, 조각 사이 40초, 전체 150초.
- `_iter_hosted_with_fallback`: 첫 조각 전에 막히면 예비로, 조각을 보낸 뒤 끊기면 오류.
- 예비는 최근 대사 8개(`LLM_FALLBACK_MAX_TURNS`), 출력 320토큰(`LLM_FALLBACK_MAX_TOKENS`), `think: False`.
- `iter_generate`가 호스팅 조각을 그대로 넘겨 웹소켓 화면에도 바로 흐른다.
- `request_priority.py`와 `main.py` 미들웨어: `X-AI-Priority: background`를 요청 동안 기억하고, 배경 요청은 예비로 가지 않는다.
- JSON 스키마 호출은 그대로 한 번에 받기.
- compose와 `.env.example`에 새 설정 4개(기본값 있음).

### 기술 포인트

시간 제한을 "전체"가 아니라 "조각 사이"에 건다. 반쯤 나간 답을 예비 답으로 바꾸면 화면에 두 답이 섞이므로, 조각 뒤 끊김은 예비 없이 오류로 둔다.

### 안 한 것

서버에 올리지 않았다(개인키 없음). 실제 NVIDIA 키로 스트리밍 모양을 시험하지 않았다.

## 결과

### 동작 확인

- AI 단위 시험 89개 통과(스트리밍 모음, JSON 한 번에, 긴 답 안 끊김, 첫 조각 전 막힘 → 가벼운 예비, 조각 뒤 끊김 → 502, 배경 → 예비 없음, 우선순위 머리글 전달).
- 로컬 Ollama로 센 예비 프롬프트 토큰: 2146 → 1363(−37%).

### 리스크

호스팅이 첫 조각 전에 자주 막히면 40초 + 가벼운 예비가 1분을 넘길 수 있다.

### 후속

서버에 `api`·`ai`를 다시 빌드해 올리고 한 턴 시간을 잰다(TASKS U13).

### 관련 문서

- `docs/trainings/oracle-deploy-latency.md`
- `docs/find_debug/2026-11-11.md`
