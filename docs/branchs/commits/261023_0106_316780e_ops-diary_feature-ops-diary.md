# 오퍼레이션 일기

| 항목 | 내용 |
|------|------|
| Subject | `feat(ops): 오퍼레이션 일기` |
| Full SHA | `316780ea9deecba7a24d2af6053d744e703a8abb` |
| Short SHA | `316780e` |
| Branch | `feature/ops-diary` |
| Parent | `7e786f0` (feature/ops-mind) |
| Date | 2026-10-23T01:06:44+09:00 |

## 주 내용

- 오퍼레이션 · 일기: 캐릭터가 자기 입장에서 최근 대화에서 겪은 일과 기분을 1인칭으로 쓴 일기(제목·기분·본문) — 20 코레딧
- 화면: 오퍼레이션 메뉴에 "일기", 줄 노트 느낌의 일기 카드 목록
- API GET/POST /characters/:id/chat/ops/diary, AI POST /diary, 테이블 diary_entries

## 상세

**배경**
사용자 요청("일기 기능 : 메모를 마치 그 특정 캐릭터의 기준으로만 나타나서 자신의 지났던 일을 경험, 기분을 그대로 작성")에 따라 만들었다.

**변경 범위**
apps/api(operations·prisma), services/ai(operations·fake_llm), apps/web(diary 화면·메뉴·lib·actions·ops.module.css), e2e/tests/operations.spec.ts, docs

**기술 포인트**
- 심리 탐구와 같은 틀(operationContext·코레딧 선차감·실패 시 환불)
- 날짜는 본문에 쓰지 않게 하고 기록 시각을 따로 보여 준다(모델이 날짜를 지어내지 않게)
- 대화에 없던 사건은 지어내지 않게 지시

**안 한 것**
실제 gemma로 일기 품질은 아직 확인하지 않음

## 결과

**동작 확인**
- 타입 검사 api·web(next typegen 뒤), oxlint
- e2e operations.spec 5개(심리 탐구 3 + 일기 2) 통과

**리스크**
없음

**후속**
메시지

**관련 문서**
OPERATIONS.md, API_DOCUMENTATION, DATABASE, AI_MODEL_STRATEGY, NAVIGATION_IA
