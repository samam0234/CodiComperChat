# 존재하지 않는 Gemini 모델명 gemini-3-flash를 안정판 gemini-3.6-flash로 교체

| 항목 | 내용 |
|------|------|
| Subject | `fix(ai): 존재하지 않는 Gemini 모델명 gemini-3-flash를 안정판 gemini-3.6-flash로 교체` |
| Full SHA | `5d3b9697495a33fa6b25397e7bc9b6be9aa2c332` |
| Short SHA | `5d3b969` |
| Branch | `fix/gemini-model-name` |
| Parent | `ef36526` (develop) |
| Date | 2026-09-26T00:38:47+09:00 |

## 주 내용

- `services/ai/app/services/llm.py`의 `DEFAULT_MODEL`을 `gemini-3-flash`에서 `gemini-3.6-flash`로 교체
- `services/ai/.env.example`의 모델 예시를 같은 값으로 맞추고 "잘못된 이름은 404" 안내와 모델 목록 링크 추가
- `docs/plan/CURRENT_STACK.md`의 모델명 기재 갱신

## 상세

**배경**
웹 채팅 요청이 `POST /api/characters/:id/chat 502`로 끝났다. Nest는 FastAPI의 오류를 그대로 전달하고, FastAPI가 Gemini에서 `404 NOT_FOUND: models/gemini-3-flash is not found`를 받은 것이 원인이었다. 코드 기본값과 로컬 `services/ai/.env`가 둘 다 존재하지 않는 이름을 쓰고 있었다. 채팅·대답 추천·에이전트가 모두 같은 `llm.py`를 거치므로 전부 실패했다.

**변경 범위**
`services/ai`(`llm.py`, `.env.example`), 문서(`CURRENT_STACK.md`). 로컬 `services/ai/.env`(git 추적 밖)의 `GEMINI_MODEL` 한 줄도 같은 값으로 고쳤다(키 줄은 건드리지 않음).

**기술 포인트**
- 이름은 Google이 발급한 정확한 모델 코드여야 한다. 공식 문서상 유효한 Flash: `gemini-3.8-flash`, `3.7`, `3.6`, `3.5`, `gemini-3-flash-preview`.
- 기본값을 안정판 `gemini-3.6-flash`로 정한 이유: 조사 시점에 3.8·3.7·3.5는 수요 과부하(503)였고 3.6과 `-preview`만 응답했다. 프리뷰보다 안정판을 택했다. 상황은 바뀔 수 있으므로 `GEMINI_MODEL`로 덮어쓸 수 있게 뒀다.
- `uvicorn --reload`는 `.py` 변경만 감시하고 `.env` 변경은 보지 않는다. `.env`를 고친 뒤에는 서버를 재시작하거나 `.py`를 저장해 다시 띄워야 반영된다. 이번 수정 중에도 워커가 `.env` 수정 전에 떠서 옛 값을 한 번 더 읽는 일이 있었다.

**안 한 것**
모델명 유효성을 서버 시작 시 검사하는 기능(잘못된 이름이면 첫 호출 때 404로만 드러난다). `.env` 변경 자동 감지.

## 결과

**동작 확인**
- 새로 띄운 FastAPI에서 `/infer` 200(프로필을 반영한 대사).
- 실행 중이던 8000번 FastAPI를 재시작한 뒤 `/infer` 3회 연속 200.
- 임시 Nest(4999)를 통한 전체 경로: 캐릭터 채팅 200, 대답 추천 200(3개), 에이전트 200.

**리스크**
무료 등급 분당 한도(429)와 최신 모델의 간헐적 503은 그대로다.

**후속**
서버 시작 시 모델명 검증, 요청 속도 제한.

**관련 문서**
[services/ai/README.md](../../../services/ai/README.md), [docs/plan/CURRENT_STACK.md](../../plan/CURRENT_STACK.md)
