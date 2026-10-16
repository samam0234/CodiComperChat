# 인프라 장애·해결 지식

연결 실패, 포트 충돌, DB 끊김 등 **다시 터질 수 있는 이슈**와 해결을 모은다. [../find_debug/](../find_debug/)(일지)에서 정제된 내용을 여기로 올리는 식으로 쓴다.

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
- [test-flaky-under-load.md](test-flaky-under-load.md) — 시험이 가끔 실패하는데 혼자 돌리면 늘 통과 (3개 동시 실행으로 재현)
- [empty-env-var.md](empty-env-var.md) — 빈 환경변수가 "설정됨"으로 읽혀 기본값이 안 먹음 (`??` vs `||`)
