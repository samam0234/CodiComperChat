# 서버를 끈 전체 e2e 결과를 기록

| 항목 | 내용 |
|------|------|
| Subject | `docs(docs): 서버를 끈 전체 e2e 결과를 기록` |
| Full SHA | `07561f1ecee4ab9b02860ff44fd0cd80b6972a81` |
| Short SHA | `07561f1` |
| Branch | `feature/docs-handoff` |
| Parent | `e3c33eb` |
| Date | 2026-11-04 00:13:24 +0900 |

## 주 내용

- 개발 서버를 끈 전체 e2e가 111/112인 이유를 디버그 일지와 인수인계·시험 문서에 적었다
- `chat.spec.ts:31`은 그 실행에서 통과해, 이전 반복 실패를 메모리 부족으로 적었다
- `webtoon.spec.ts:95`는 전체에서만 실패하고 따로 돌리면 통과해 코드 결함으로 보지 않았다
- 112건이 아니라 `develop` 병합은 하지 않았다고 적었다

## 상세

**배경**
병합 조건이 전체 e2e 112건 통과다. 서버를 끄고 다시 돌렸지만 다른 프로그램 때문에 남은 RAM이 약 330MB였고 한 건이 실패했다.

**변경 범위**
docs/find_debug/2026-11-03.md, docs/AGENT_HANDOVER.md, docs/TASKS.md, docs/plan/TESTING.md, docs/repeater/test-flaky-under-load.md

**기술 포인트**
실패 시험이 실행마다 바뀌고, 실패한 화면 시험만 따로 돌리면 통과한다. 시간 제한은 늘리지 않았다.

**안 한 것**
develop 병합. LICENSE 문구. 저장소는 인증 없는 GitHub API가 200이라 아직 공개로 본다.

## 결과

**동작 확인**
`npm run test:e2e` 111 passed / 1 failed (17.9분). `tests/webtoon.spec.ts:95` 단독 1 passed (22.4초).

**리스크**
같은 PC 상태에서 전체를 다시 돌리면 다른 시험이 시간 초과할 수 있다.

**후속**
남은 RAM을 확보한 뒤 전체 e2e를 다시 돌리고, 112건이면 지정한 7개 브랜치를 develop에 병합한다.

**관련 문서**
[docs/find_debug/2026-11-03.md](../../find_debug/2026-11-03.md)
[docs/TASKS.md](../../TASKS.md)
