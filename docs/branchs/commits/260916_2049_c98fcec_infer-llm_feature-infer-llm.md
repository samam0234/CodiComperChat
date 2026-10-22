# /infer에 실제 LLM 호출 연결

| 항목 | 내용 |
|------|------|
| Subject | `feat(ai): /infer에 실제 LLM 호출 연결` |
| Full SHA | `c98fcecd86363dfa41e2772c8c9f9f23520df7ed` |
| Short SHA | `c98fcec` |
| Branch | `feature/infer-llm` |
| Parent | `ac1f369` |
| Date | 2026-09-16 20:49:23 +0900 |

## 주 내용

- `_build_system_prompt`: `ContextSlice` → 시스템 프롬프트 (카드 핵심 + 잠긴 비밀 주제 + 관계/훅/로어/기억/디렉터 노트)
- `_build_messages`: `recent_turns` → anthropic 메시지 포맷
- `ANTHROPIC_API_KEY` 없으면 503 (501 아님 — 설정 부재이지 미구현이 아니다)
- `InferResponse(reply: str)` 추가, 라우트가 값을 실제로 반환

## 상세

**배경**
"유지성이랑 대화할 수 있는 llm 채팅을 만들어야 해"라는 요청의 첫 단인 실제 추론 자리를 채웠다. `services/ai`는 지금까지 뼈대(스키마·라우트)만 있고 어디서도 LLM을 부르지 않았다.

**변경 범위**
`services/ai/requirements.txt`(+anthropic 1.6.0), `app/schemas/infer.py`, `app/routes/infer.py`, `app/services/inference.py`, `docs/plan/CURRENT_STACK.md`

**기술 포인트**
- **잠긴 비밀은 "주제만" 프롬프트에 넣는다.** `locked_secret_topics`는 있지만 그 내용을 Nest가 애초에 채워 보내지 않는 구조라(공개 API가 `secret` 필드를 안 줌), 여기서 가릴 게 없다 — 받는 쪽에 처음부터 없다.
- **503 vs 501을 구분했다.** 501은 "이 기능을 만들 생각이 없다", 503은 "설정(키)이 없어서 지금 못 한다". 벤더가 정해지면 이 메서드 하나만 바뀐다.
- **벤더는 배선 검증용 잠정값이다.** `docs/plan/AI_MODEL_STRATEGY.md`가 "이 문서에서 벤더를 새로 정하지 않는다"고 못박아서 그 문서는 안 건드렸다. `CURRENT_STACK.md`에는 "제품 결정 아님"이라고 명시했다.

**안 한 것**
- 스트리밍 — 지금은 단발 응답. §5.3의 스트리밍 요구는 Nest 중계까지 붙을 때 처리.
- summarize/critique-test 실제 구현 — 이번엔 infer만.

## 결과

**동작 확인**
- `anthropic==1.6.0` 설치, `messages.create` 시그니처 확인
- 포트 8001에서 기동 확인 (8000은 이전 세션 프로세스가 점유 중이라 못 껐음 — 아래 리스크 참고)
- 유지성 카드로 만든 `ContextSlice` 페이로드로 `POST /infer` → pydantic 검증 통과, 503 + 안내 문구 정상 반환

**리스크**
- 로컬 8000번 포트에 이전 세션에서 띄운 uvicorn이 아직 떠 있는데, `Stop-Process`/`taskkill` 양쪽 다 해당 PID를 못 찾는다 — 구 코드(501 무조건)로 계속 응답 중이다. 사용자가 직접 그 창을 닫고 재기동해야 새 코드가 반영된다.
- 여전히 벤더 미확정 — 실제 서비스 오픈 전 재검토 필요.

**후속**
Nest에서 Character → ContextSlice 변환 후 이 엔드포인트 호출

**관련 문서**
`CodiComperChat_project_plan.md` §13.3 §15, `docs/plan/AI_MODEL_STRATEGY.md`, `docs/plan/CURRENT_STACK.md`
