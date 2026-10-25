# 오퍼레이션 메뉴와 심리 탐구

| 항목 | 내용 |
|------|------|
| Subject | `feat(ops): 오퍼레이션 메뉴와 심리 탐구` |
| Full SHA | `9300d6bd19c55bef1090538233b0d8b19ca7be02` |
| Short SHA | `9300d6b` |
| Branch | `feature/ops-mind` |
| Parent | `97c3f87` (develop) |
| Date | 2026-10-23T01:02:30+09:00 |

## 주 내용

- 오퍼레이션(대화 플러그인) 틀: 채팅 입력창 바로 위 줄의 "✦ 오퍼레이션" 메뉴(위로 펼침, 화살표·Esc·바깥 클릭)
- 심리 탐구: 지금 장면에서 캐릭터의 1인칭 속마음·감정·나에 대한 생각을 엿봄 (30 코레딧)
- 공통 기반: 대화 맥락 조립 operationContext, 코레딧 먼저 빼고 실패하면 돌려주기, 코레딧 사유 OPERATION
- API GET/POST /characters/:id/chat/ops/mind, AI POST /mind, 테이블 mind_readings

## 상세

**배경**
사용자 요청("오퍼레이션 : 제타의 플러그인 기능 … 심리 탐구 : 상대가 생각하는 머리속을 볼 수 있다")에 따라 만들었다. 질문으로 정한 것: 쉬운 것부터 기능마다 브랜치, 글을 새로 쓰는 기능은 코레딧, 코디포토넷은 화면만.

**변경 범위**
apps/api(operations 모듈·credits·character-chat·prisma), services/ai(operations), apps/web(ops-bar·mind 화면·lib·actions), e2e/tests/operations.spec.ts, docs(OPERATIONS.md 신규 외)

**기술 포인트**
- 오퍼레이션 맥락은 대화와 같은 조립(고정 프로필·기억·상태설정·이야기 상태·최근 대화), 비밀은 애초에 보내지 않음
- AI는 캐릭터 연기 프롬프트를 그대로 쓰고 마지막에 괄호 '작가 지시'로 이번 글의 종류를 정함 — 규칙 6(괄호=장면 지시)과 맞물림
- 대화가 없으면 코레딧을 빼기 전에 409
- 마이그레이션: CreditReason에 OPERATION 추가 + mind_readings(대화 지우면 함께 삭제)

**안 한 것**
일기·메시지·커뮤니티·코디포토넷은 다음 브랜치들. 실제 gemma로 속마음 품질은 아직 확인하지 않음(가짜 LLM으로 시험)

## 결과

**동작 확인**
- 타입 검사 api·web, oxlint, AI 서비스 불러오기(/mind 등록)
- e2e operations.spec 3개(대화 전 409·코레딧 그대로, 30 코레딧 차감·기록, 부족 403, 화면 메뉴→엿보기) 통과

**리스크**
없음

**후속**
일기

**관련 문서**
docs/plan/OPERATIONS.md(신규), API_DOCUMENTATION, DATABASE, AI_MODEL_STRATEGY, NAVIGATION_IA
