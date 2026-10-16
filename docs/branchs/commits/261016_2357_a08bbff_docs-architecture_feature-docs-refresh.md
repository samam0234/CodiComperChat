# 시스템·앱·계층·데이터 흐름과 AI 파이프라인을 실제 동작으로 갱신

| 항목 | 내용 |
|------|------|
| Subject | `docs(architecture): 시스템·앱·계층·데이터 흐름과 AI 파이프라인을 실제 동작으로 갱신` |
| Full SHA | `a08bbffa35bfa391e206cc9fe64c3c712f79a917` |
| Short SHA | `a08bbff` |
| Branch | `feature/docs-refresh` |
| Parent | `d2bca64` (feature/docs-refresh) |
| Date | 2026-10-16T23:57:10+09:00 |

## 주 내용

- `Architecture/overview.md`: "코드 미착수 — 목표 구조" → 실제 구성도(웹 proxy·서버 액션, Nest와 PostgreSQL·지식 파일·SMTP·토스, AI 대기열, FastAPI, Ollama, 결제창 경로)
- `Architecture/apps.md`: "서로 연결 없음·전부 501" 제거, 계획서 §8 화면 지도 ↔ 실제 경로, 앱 사이 연결 방식(쿠키 → Bearer, X-Forwarded-For, postToAi)
- `Architecture/layers.md`: 가드 순서, Repository 대신 PrismaService(원시 SQL을 쓰는 두 곳), 입력 검증 방식, FastAPI의 llm.generate, 웹 계층
- `Architecture/data-flow.md`: 대화 한 턴 6단계, 새로하기·이어하기, 정리 결과 머지 규칙(친밀도 폭 제한·자동 변화 끄기·비슷한 복선 버림), 공방·초상·계정·결제 흐름
- `WORKFLOW.md`: 실제 경로와 순서, 개인사 검사, 배경 정리, AI 대기열 표, 컨텍스트 예산의 지금 값, 스트리밍 미구현

## 상세

**배경**
사용자 요청(문서 업데이트). Architecture 문서는 "코드 미착수"·"Controller → Service(전부 501) → 아직 없음" 상태로 남아 있었고, WORKFLOW는 계획서의 `/campaigns/:id/messages` 스트림 경로를 실제처럼 적고 있었다. SKILL.md §7: 구현이 바뀌면 Architecture를 먼저 갱신한다.

**변경 범위**
docs/Architecture(overview, apps, layers, data-flow), docs/WORKFLOW.md

**기술 포인트**
- 흐름은 코드를 따라가 확인했다(character-chat.service의 send, grounding.ts 재시도 횟수, MEMORIZE/DIGEST_EVERY_MESSAGES=6, CONTEXT_TURNS=30, story-logic의 친밀도 반영 규칙, MAX_DELTA=8).
- 처음 쓴 "유저가 직접 정한 친밀도는 자동으로 안 바꾼다"는 코드와 달라 고쳤다 — 실제는 상태설정의 "자동 변화" 스위치가 끄고 켠다.
- 계획서와 다른 점(스트리밍 없음, 선택지 대신 대답 추천, 공방이 일반 유저에게 열림)은 그대로 밝혔다.

**안 한 것**
없음

## 결과

**동작 확인**
- 문서 속 경로·숫자를 코드와 대조

**리스크**
없음

**후속**
guidance 문서 갱신

**관련 문서**
[docs/Architecture/overview.md](../../Architecture/overview.md)
