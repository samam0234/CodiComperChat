# 호스티드 LLM을 Gemini Flash로 교체하고 .env 자동 로딩 추가

| 항목 | 내용 |
|------|------|
| Subject | `feat(ai): 호스티드 LLM을 Gemini Flash로 교체하고 .env 자동 로딩 추가` |
| Full SHA | `9fb0de0a459d6af78e86b4f8016d4d5b6e1a90a7` |
| Short SHA | `9fb0de0` |
| Branch | `feature/gemini-llm` |
| Parent | `9e12298` (develop) |
| Date | 2026-09-25T23:28:04+09:00 |

## 주 내용

- `inference.py`: google-genai `generate_content`, 대화 역할을 user/model로 변환, 시스템 프롬프트는 `system_instruction`
- `requirements.txt`: `anthropic` 제거, `google-genai==2.25.0` 추가
- `app/main.py`: `services/ai/.env`를 `load_dotenv`로 직접 로딩 (기존 환경변수는 덮지 않음)
- 5xx 재시도(최대 4회), 429는 재시도 없이 안내 메시지로 429 응답, 빈 응답은 502
- `services/ai/.env.example` 신규, `apps/api/.env.example`에 `AI_BASE_URL` 추가

## 상세

**배경**
사용자가 Claude가 아니라 Gemini Flash를 쓰겠다고 정했다. 이후 키를 넣었는데도 "호스티드 LLM이 연결되지 않았다"가 나왔는데, uvicorn을 `--env-file` 없이 실행해 `.env`가 읽히지 않은 것이 원인이었다.

**변경 범위**
services/ai (`inference.py`, `main.py`, `requirements.txt`, README, `.env.example`), `apps/api/.env.example`, `docs/plan/CURRENT_STACK.md`

**기술 포인트**
모델명과 SDK 파라미터(`ThinkingConfig.thinking_level`, `HttpRetryOptions`)는 공식 문서와 설치한 SDK 타입 정의로 확인했다. 429를 재시도하면 무료 등급 한도만 더 깎여 재시도 대상에서 뺐다.

**안 한 것**
제품 차원의 LLM 벤더 확정과 멀티 벤더 구조는 하지 않았다(`AI_MODEL_STRATEGY.md` 정책 유지). 스트리밍 응답은 아직이다.

## 결과

**동작 확인**
키 없음 → 503, 가짜 클라이언트로 역할 변환·설정값 확인, 실제 키로 `/infer` 200(6회 중 5회, 1회는 Google 과부하 503). 모델 4종 직접 호출 성공.

**리스크**
무료 등급은 분당 요청 한도가 낮아 연속 대화 시 429가 자주 날 수 있다.

**후속**
유료 등급 전환 또는 요청 속도 제한, 스트리밍 응답

**관련 문서**
[services/ai/README.md](../../../services/ai/README.md), [docs/plan/CURRENT_STACK.md](../../plan/CURRENT_STACK.md)
