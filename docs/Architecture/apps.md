# 앱 역할

정본: `CodiComperChat_project_plan.md` §7.2, §8. 최종 갱신 2026-10-16 — 세 앱이 연결되어 동작한다.

| 앱 | 스택 | 위치 | 역할 |
|----|------|------|------|
| web | Next.js 16 (React 19, App Router) | `apps/web/` | 홈·인기·캐릭터 상세, 대화(채팅)·이어하기·기억·상태설정·지난 이야기·엑스트라, 공방(7단계), 대화 목록, 마이페이지·설정, 로그인·가입·이메일 인증·비밀번호 찾기, 요금·결제, 운영자 화면, 약관 |
| api | Nest.js 12 (TypeScript, ESM) + Prisma 7 | `apps/api/` | 인증·계정, 캐릭터, 대화와 컨텍스트 조립, 기억·이야기 정리, 공방(초안·테스트·발행·초상 검수), 신고, 결제, 요청 한도, AI 호출 대기열. 웹이 유일하게 직접 치는 대상 |
| ai | FastAPI (Python 3.12) | `services/ai/` | `/infer` `/summarize` `/critique-test` `/remember` `/suggest-replies` `/assist` `/ground-check` `/draft-field` `/moderate-image`, `/train`(403). Nest만 내부에서 호출 |

## 화면 지도 (계획서 §8 → 구현)

| 계획서 §8 | 구현 | 경로 |
|---|---|---|
| 홈 — 진행 중 캠페인, 캐릭터 선택 | 히어로 + "이어서 대화하기"(최근 3개) + 캐릭터 카드 | `/` |
| 세션(채팅) — 스트림, 선택지, 세션 종료 | 대화 + 대답 추천(선택지 대신) + 새로하기(저장/저장 안 함)·이어하기. **스트리밍은 아직 아님**(답이 다 오면 보인다) | `/characters/:id/chat` |
| 캠페인 상태 패널 — 관계, 열린 훅, 지난 요약 | 대화 아래 "지난 이야기"(친밀도·복선·요약), 점 세 개 메뉴의 기억·상태설정, 엑스트라 | 같은 화면, `/chat/memories`, `/chat/settings` |
| 캐릭터 공방 — 7단계, 운영자부터 | 7단계 + 칸별 AI 초안 + 3턴 테스트(판정 통과해야 발행) + 초상(자동 검수). **일반 유저에게도 열림**(사용자 지시) | `/studio`, `/studio/:id` |
| 세션 로그북 | 대화 목록 + 저장한 대화 | `/library`, `/chat/saved` |
| 설정 — 계정, 수위, 알림 | 테마·계정·비밀번호·탈퇴. 수위·알림은 "준비 중" | `/settings` |

그 밖에 신규: 인기(`/popular`), 에이전트(사용 안내 챗봇 `/agents`), 마이페이지(`/me`), 요금·결제(`/pricing`, `/billing/*`), 운영자(`/admin/*`). 라벨·경로 전체는 [../plan/NAVIGATION_IA.md](../plan/NAVIGATION_IA.md).

## 서로 어떻게 연결되나

- **web → api**: 서버 컴포넌트·서버 액션만 부른다(`API_BASE_URL`, 기본 `http://localhost:4000`). 로그인 토큰은 httpOnly `session` 쿠키에서 꺼내 `Authorization: Bearer`로 붙인다. 브라우저가 Nest를 직접 부르지 않아 CORS를 열지 않았다. 요청 한도가 사람마다 세어지도록 실제 IP를 `X-Forwarded-For`로 넘긴다
- **api → ai**: `apps/api/src/ai/ai-client.ts`의 `postToAi`가 대기열을 거쳐 부른다(`AI_BASE_URL`, 기본 `http://localhost:8000`). ai에는 아직 서비스 토큰 인증이 없다 — 내부망 전제(배포 때 막는다)
- **ai → Ollama**: `services/ai/app/services/llm.py`(`OLLAMA_BASE_URL`, `OLLAMA_MODEL`)

## 공방(Studio)은 별도 앱이 아니다

공방은 `apps/web` 안의 화면이다. 별도 콘솔 앱/포트를 만들지 않았다.

관련: [overview.md](overview.md), [../guidance/web-frontend.md](../guidance/web-frontend.md), [../guidance/studio-workshop.md](../guidance/studio-workshop.md)
