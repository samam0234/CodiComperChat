# 인프라 장애·해결 지식

연결 실패, 포트 충돌, DB 끊김 등 **다시 터질 수 있는 이슈**와 해결을 모은다. [../find_debug/](../find_debug/)(일지)에서 정제된 내용을 여기로 올리는 식으로 쓴다.

<!-- logic-structure -->
## 로직 구조

```text
find_debug(일지)에서 "또 생길 수 있다"로 판단 ─▶ 이 폴더에 이슈 하나 = 파일 하나
   1. 환경 → 2. 증상 → 3. 원인 → 4. 해결 → 5. 검증 명령
같은 증상을 다시 보면: 증상으로 이 목록을 먼저 찾는다
```

<!-- logic-mermaid -->

### 이슈 문서 형식

```mermaid
flowchart LR
  E["1 환경"] --> S["2 증상"] --> C["3 원인"] --> F["4 해결"] --> V["5 검증 명령"]
```

## 이슈 작성 템플릿

1. 환경 (local / docker)
2. 증상
3. 원인
4. 해결
5. 검증 명령

## 파일명

주제별 하나씩, 예: `docker-postgres-port.md`, `nest-fastapi-internal-network.md`, `prisma-migration-conflict.md`

## 기록된 이슈

- [nest-dev-server-dist-missing.md](nest-dev-server-dist-missing.md) — `Cannot find module dist/main`으로 죽고 안 살아남, 포트 4000 충돌
- [test-flaky-under-load.md](test-flaky-under-load.md) — 시험이 가끔 실패하는데 혼자 돌리면 늘 통과 (3개 동시 실행으로 재현), e2e 전체 실행의 시간 초과
- [empty-env-var.md](empty-env-var.md) — 빈 환경변수가 "설정됨"으로 읽혀 기본값이 안 먹음 (`??` vs `||`)

- [heredoc-escape.md](heredoc-escape.md) — Git Bash heredoc 안의 파이썬 문자열 이스케이프가 결과 파일에서 실제 줄바꿈이 됨 (2026-11-06)
