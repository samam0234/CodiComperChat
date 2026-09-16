# 캐릭터 상세에 시작하기 버튼과 채팅 화면 추가

| 항목 | 내용 |
|------|------|
| Subject | `feat(web): 캐릭터 상세에 시작하기 버튼과 채팅 화면 추가` |
| Full SHA | `6f86d67aa4e833e2b975e2c373e70944957f1328` |
| Short SHA | `6f86d67` |
| Branch | `feature/character-chat-web` |
| Parent | `e75ca66` |
| Date | 2026-09-16 20:55:14 +0900 |

## 주 내용

- 캐릭터 상세 "설정" 섹션 아래 "OO와 대화 시작하기" 버튼
- `apps/web/app/characters/[id]/chat/{page,character-chat,page.module,character-chat.module}` 신설
- `apps/web/app/api/characters/[id]/chat/route.ts` — Nest 중계

## 상세

**배경**
`feature/character-chat-relay`로 백엔드 배선이 끝났으니, 사용자가 실제로 누르고 칠 수 있는 화면을 붙였다. "설정 밑에 시작하기 버튼을 누르면 캐릭터 봇이랑 대화할 수 있는 llm 채팅을 만들어야 해"라는 요청 그대로다.

**변경 범위**
`apps/web/app/characters/[id]/page.tsx`(버튼), `page.module.css`, 신규 `apps/web/app/characters/[id]/chat/*`, `apps/web/app/api/characters/[id]/chat/route.ts`

**기술 포인트**
- **시작 장면을 그대로 첫 메시지로 썼다.** 계획서 §5.1 "첫인사 = 시작 장면"을 문자 그대로 구현한 것 — 별도로 인사말을 생성하지 않는다.
- **이력은 클라이언트 state에만 있다.** 서버가 캠페인/세션을 안 만드니 저장할 곳이 없다. 매 턴 `history` 전체를 다시 보내 Nest가 `recentTurns`로 조립한다 — 세션이 짧을 땐 문제없지만, 길어지면 매 요청 페이로드가 계속 커진다(§13.3 컨텍스트 예산과 나중에 부딪힌다).
- **에러를 캐릭터 말풍선 위치에 놓되 점선으로 구분했다.** `agent-chat`의 "시스템 메시지를 별도 줄로" 방식 대신, 여기는 "캐릭터가 침묵한다"는 느낌보다 "지금 이 캐릭터가 말할 수 없는 이유"로 읽히게 했다 — 몰입 문서(§5.3 "메타 메뉴는 점 세 개 안에 숨김")의 톤에 맞춘 선택.

**안 한 것**
- **스트리밍, 대화 저장, 재시도(리롤)** — §5.3이 언급하는 것들이지만 캠페인 인프라가 없어 이번엔 뺐다.
- **`characters/[id]/page.tsx`의 나머지** — role 배지 등은 이전 커밋에서 이미 처리됨.

## 결과

**동작 확인**
- `npx tsc --noEmit` 통과
- 상세 페이지에 버튼·링크 렌더링 확인
- `/characters/<id>/chat` 200, 시작 장면이 첫 메시지로 렌더링, 입력창 placeholder 확인
- `POST /api/characters/<id>/chat` → Nest → FastAPI(8001, 테스트용) → 503 relay 확인, 웹 끝단까지 도달

**리스크**
- 대화가 길어지면 클라이언트가 매번 전체 이력을 재전송한다 — 캠페인/세션이 생기면 서버 저장으로 옮겨야 한다.

**후속**
- LLM 키 연결 시 실제 응답 확인
- 캠페인/세션 붙으면 대화 영속화로 전환

**관련 문서**
`apps/api/src/character-chat/*`, `docs/plan/CHARACTERS.md`, `CodiComperChat_project_plan.md` §5.1 §5.3
