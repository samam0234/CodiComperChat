# 에이전트 챗봇 UI와 메시지 중계 경로 추가

| 항목 | 내용 |
|------|------|
| Subject | `feat(web): 에이전트 챗봇 UI와 메시지 중계 경로 추가` |
| Full SHA | `821d58abcc2966a8b491316136d5c19e63ded611` |
| Short SHA | `821d58a` |
| Branch | `feature/agent-chat` |
| Parent | `7a3356f` |
| Date | 2026-09-16 20:28:51 +0900 |

## 주 내용

- `apps/web/app/agents/agent-chat.tsx` — 입력창·전송 버튼·대화 목록·전송 중 상태를 가진 클라이언트 컴포넌트
- 빈 상태에 예시 질문 3개 (누르면 즉시 전송)
- `apps/web/app/api/agent-chat/route.ts` — Nest로 넘기는 얇은 중계
- `apps/api/src/agent-chat/` — `POST /agent-chat/messages` 신설
- 현재 응답은 503 + "연결된 LLM이 없다" 안내

## 상세

**배경**
직전 커밋에서 에이전트 페이지를 "AI 챗봇 가이드·프롬프트 추천"으로 정정했는데, 내용은 여전히 설명 문단 목록이었다. 사용자가 "입력창이 있어야 하는데 뭔 가이드 문단만 놓은 거야? 그게 챗봇이야?"라고 지적했다. 맞는 지적이라 실제 대화 UI로 바꿨다.

**변경 범위**
- 신규: `apps/web/app/agents/{agent-chat.tsx,agent-chat.module.css,page.module.css}`, `apps/web/app/api/agent-chat/route.ts`, `apps/api/src/agent-chat/{controller,service,module}.ts`
- 수정: `apps/web/app/agents/page.tsx`, `apps/api/src/app.module.ts`

**기술 포인트**
- **LLM을 임의로 고르지 않았다.** 환경에 API 키가 없고(`env` 확인), 호스티드 LLM 벤더는 계획서 §15의 열린 항목이며 `AI_MODEL_STRATEGY.md`도 "이 문서에서 벤더/모델명을 새로 정하지 않는다"고 못박았다. 벤더 선택은 비용이 드는 사용자 결정이라 배선만 끝까지 해 두고 마지막 한 칸을 비웠다.
- **503(ServiceUnavailable)을 골랐다.** 501(NotImplemented)은 "이 기능을 만들 생각이 없다"에 가깝고, 여기는 코드가 아니라 **설정(벤더/키)이 없어서** 못 하는 상태다. 503이 더 정확하고, 벤더가 붙으면 이 한 메서드만 바뀐다.
- **웹 → Next Route Handler → Nest** 구조로 갔다. 브라우저가 직접 Nest를 부르면 API 주소가 노출되고 CORS 설정이 필요해진다. Route Handler는 **중계만** 하고 추론을 하지 않으므로 "Next.js Route에 무거운 추론을 넣지 않는다"(계획서 §7.1)를 어기지 않는다. 웹이 FastAPI를 직접 부르지 않는다는 금지(`api-usage.md`)도 그대로 지킨다.
- **에러를 대화 안에 시스템 메시지로 흘렸다.** alert이나 토스트 대신 로그에 점선 박스로 쌓이게 해서, 사용자가 무엇을 물었을 때 무엇이 막혔는지 맥락과 함께 남는다.
- 전송 중에는 입력창·버튼·예시 질문을 모두 비활성화한다. 중복 전송으로 같은 질문이 쌓이는 걸 막는다.
- `role="log"` + `aria-live="polite"`로 스크린리더가 새 메시지를 읽게 했다.

**안 한 것**
- **스트리밍** — 계획서 §5.3은 "답변 완료 전에도 말투가 먼저 보여야 함"을 요구하지만, 스트림할 내용 자체가 없다. LLM 연결 때 SSE로 바꾼다.
- **대화 이력 저장** — 새로고침하면 사라진다. `Message` 테이블은 캠페인 세션용이라 이 어시스턴트 대화와 성격이 다르다. 저장이 필요해지면 모델을 따로 정해야 한다.
- **프롬프트 추천 기능** — 예시 질문 3개는 하드코딩이다. 상황별 추천은 LLM이 붙은 뒤에 의미가 있다.
- **인증** — 누구나 호출할 수 있다. `/auth/*`가 501이라 붙일 것이 없다.

## 결과

**동작 확인**
- `npm run build --workspace api`, `npx tsc --noEmit`(web) 모두 통과
- `/agents` 200 — 입력창(placeholder "무엇이든 물어보세요"), 보내기 버튼, 예시 질문 렌더링 확인
- `POST /api/agent-chat`(웹) → 503 + 안내 문구 전달 확인
- `POST /agent-chat/messages`(Nest 직접) → 503, 빈 메시지 → 400

**리스크**
- **범위 문제.** `/agent-chat/messages`는 계획서 §13.1 공개 엔드포인트 목록에 없다. 또한 범용 AI 어시스턴트는 §9.2가 v1에서 뺀 "생산성 기능"과 경계가 붙어 있다. 사용자 지시로 만들었으나 계획서 반영 여부는 확인이 필요하다.
- 인증이 없어 공개 상태다. 실제 LLM을 붙이면 비용이 그대로 노출되므로, 벤더 연결 전에 인증이나 레이트리밋이 필요하다.

**후속**
- 호스티드 LLM 벤더 확정 → `AgentChatService.send()` 구현
- 연결 시 SSE 스트리밍으로 전환
- 인증·레이트리밋
- 계획서 §13.1 / §9.2와의 정합성 확인

**관련 문서**
`docs/plan/AI_MODEL_STRATEGY.md`, `docs/plan/NAVIGATION_IA.md`, `docs/guidance/api-usage.md`, `CodiComperChat_project_plan.md` §5.3 §7.1 §9.2 §13.1 §15
