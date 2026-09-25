# 호스티드 LLM을 Gemini에서 로컬 Ollama(gemma4:e4b)로 교체

| 항목 | 내용 |
|------|------|
| Subject | `feat(ai): 호스티드 LLM을 Gemini에서 로컬 Ollama(gemma4:e4b)로 교체` |
| Full SHA | `75bacbffafba49a0902646f7f94bc43e14645ad3` |
| Short SHA | `75bacbf` |
| Branch | `feature/ollama-llm` |
| Parent | `3600e03` (develop) |
| Date | 2026-09-26T01:03:52+09:00 |

## 주 내용

- `services/ai/app/services/llm.py`: `google-genai` SDK 호출을 제거하고 `httpx`로 로컬 Ollama `/api/chat`(기본 `http://localhost:11434`)을 직접 호출
- `turn()`/`generate()` 시그니처는 그대로 둬서 `assist.py`·`inference.py`·`suggestion.py` 세 호출부는 수정 없이 재사용
- gemma4:e4b가 thinking 모델이라 `think: false`를 명시해 생각 과정이 출력 토큰 한도를 다 먹는 문제를 막음
- `requirements.txt`: `google-genai` 제거, `httpx` 명시 추가(기존엔 google-genai의 전이 의존이었음)
- `services/ai/.env`, `.env.example`: `GEMINI_API_KEY`/`GEMINI_MODEL` → `OLLAMA_BASE_URL`/`OLLAMA_MODEL`
- 문서(`CURRENT_STACK.md`, `NAVIGATION_IA.md`, `API_DOCUMENTATION.md`, `services/ai/README.md`) 갱신

## 상세

**배경**
사용자가 개발 중 호스티드 LLM 비용·키 관리 없이 로컬에서 돌아가는 Ollama로 바꾸길 원했다. 로컬에 `gemma4:e4b`(외 `gemma4:12b`, `qwen3:8b`, `llama3.2:3b`)가 이미 pull되어 있었고, `ollama serve`가 `http://localhost:11434`에서 실행 중이었다. 사용자가 처음 말한 모델 태그("gemma:4eb")는 실제로 존재하지 않는 이름이라 `ollama list`로 확인해 정확한 태그(`gemma4:e4b`)를 확정했다.

**변경 범위**
`services/ai`(`llm.py`, `inference.py` 주석, `requirements.txt`, `.env`, `.env.example`, `README.md`), 문서 3종

**기술 포인트**
- Ollama Chat API(`POST /api/chat`, `stream: false`)에 `messages`(system + 대화 기록), `options.num_predict`(출력 토큰 상한), `format`(JSON 스키마 강제, `suggestion.py`가 사용)을 그대로 매핑했다.
- 처음 테스트에서 `response_json_schema`를 넘긴 요청이 빈 응답을 돌려줬다 — 원인은 gemma4가 "thinking" 모델이라 `num_predict`를 생각 과정 토큰이 다 소모하고 `done_reason: length`로 잘린 것. `think: false`를 payload에 고정해 해결(Gemini 때의 `ThinkingConfig(thinking_level=LOW)`와 같은 목적).
- `turn(role, text)`는 호출부 표기("user"/"model")를 그대로 받고 내부에서 Ollama 형식("user"/"assistant")으로 변환해, `assist.py`·`inference.py`·`suggestion.py`는 한 줄도 안 고쳤다.
- 연결 실패(서버 미기동)는 503, 모델 태그 오류(404)는 502 안내 메시지로 구분해 돌려준다.

**안 한 것**
여러 벤더(Gemini/Ollama)를 동시에 선택 가능한 멀티 벤더 구조는 만들지 않았다 — `docs/plan/AI_MODEL_STRATEGY.md`상 벤더 확정 전이라 기존처럼 단일 벤더로 유지. 스트리밍 응답도 아직이다.

## 결과

**동작 확인**
- `llm.generate()` 직접 호출 3종: 일반 응답("Say OK" → "OK"), JSON 스키마 강제 응답(정상 파싱), 멀티턴(`role: model` → `assistant` 매핑, 이전 대사 회상 확인)
- FastAPI 서버를 띄워 `POST /assist`로 엔드투엔드 확인: `{"reply": "OK"}`
- `GET /health` 200

**리스크**
로컬 Ollama가 안 떠 있으면 모든 LLM 호출이 503으로 막힌다(원격 배포 환경에서는 별도 처리 필요). gemma4:e4b(8B)는 호스티드 Gemini Flash 대비 응답 품질·속도가 다를 수 있다.

**후속**
배포 환경에서 Ollama를 어떻게 띄울지(도커 이미지 포함 여부), 벤더 최종 확정 시 멀티 벤더 리팩터링 여부.

**관련 문서**
[services/ai/README.md](../../../services/ai/README.md), [docs/plan/CURRENT_STACK.md](../../plan/CURRENT_STACK.md), [docs/plan/AI_MODEL_STRATEGY.md](../../plan/AI_MODEL_STRATEGY.md)
