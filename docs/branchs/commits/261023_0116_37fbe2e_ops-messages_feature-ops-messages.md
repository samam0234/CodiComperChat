# 오퍼레이션 메시지 (캐릭터와 문자 주고받기)

| 항목 | 내용 |
|------|------|
| Subject | `feat(ops): 오퍼레이션 메시지 (캐릭터와 문자 주고받기)` |
| Full SHA | `37fbe2e8ffde1302e646beeb1232fe399a65568d` |
| Short SHA | `37fbe2e` |
| Branch | `feature/ops-messages` |
| Parent | `41a9acb` (feature/ops-diary) |
| Date | 2026-10-23T01:16:15+09:00 |

## 주 내용

- 오퍼레이션 · 메시지: 장면 속 대화와 따로 쌓이는 휴대폰 문자 창 (코레딧 없음)
- 캐릭터 답은 /infer에 channel=message를 붙여 1~2문장 문자처럼, 행동 묘사 없이
- 휴대폰 메신저 모양 화면(상대 이름, 말풍선, 입력줄, 입력 중 표시, 실패하면 입력칸으로 되돌림)
- API GET/POST /characters/:id/chat/ops/messages, 테이블 direct_messages
- lib/format-time에 formatTime(오전/오후 h:mm, 한국 시각) 추가

## 상세

**배경**
사용자 요청("메시지 : 특정 캐릭터와 메시지를 주고 받을 수 있음")에 따라 만들었다.

**변경 범위**
apps/api(operations·prisma), services/ai(infer channel), apps/web(messages 화면·메뉴·lib·actions·format-time), e2e/tests/operations.spec.ts, docs

**기술 포인트**
- 기억·관계·이야기 상태는 대화와 공유하고 최근 기록만 문자 창 것(최근 30개)을 맥락으로 — operationContext(history)
- 답을 받은 뒤에 내 문자와 답을 한 트랜잭션으로 저장(실패한 문자는 남지 않음)
- 처음에 문자 시각을 toLocaleTimeString으로 그려 서버(Node)는 'AM 1:12', 브라우저는 '오전 1:12'로 달라 하이드레이션이 어긋났다. 기존 lib/format-time의 방식(한국 시각 직접 계산)에 formatTime을 더해 해결하고 e2e 로그에서 경고가 0개임을 확인

**안 한 것**
캐릭터가 먼저 문자를 보내는 기능, 읽음 표시

## 결과

**동작 확인**
- 타입 검사 api·web, oxlint
- e2e operations.spec 7개(메시지 2개: 대화와 분리·코레딧 0·빈 글/500자 400·대화 없으면 409, 화면에서 주고받기·새로고침 유지) 통과, 하이드레이션 경고 0

**리스크**
없음

**후속**
커뮤니티

**관련 문서**
OPERATIONS.md, API_DOCUMENTATION, DATABASE, AI_MODEL_STRATEGY, NAVIGATION_IA
