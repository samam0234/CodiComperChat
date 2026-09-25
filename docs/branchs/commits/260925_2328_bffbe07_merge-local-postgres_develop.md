# merge: feature/local-postgres into develop (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/local-postgres into develop (no-ff)` |
| Full SHA | `bffbe0716f154457b2ae5cce5c459f8d21ec0560` |
| Short SHA | `bffbe07` |
| Branch | `develop` |
| Parent | `1212935`, `181cb60` |
| Date | 2026-09-25T23:28:02+09:00 |

## 주 내용

- `feature/local-postgres`를 `develop`에 `--no-ff`로 병합
- 로컬 DB를 설치형 PostgreSQL로 전환

## 상세

**배경**
로컬 DB를 설치형 PostgreSQL로 전환 작업을 마치고 develop에 합류.

**변경 범위**
문서(`README.md`, `docs/guidance/docker-run.md`, `docs/plan/CURRENT_STACK.md`), `apps/api/.env.example`. 코드 변경 없음

**기술 포인트**
표준 병합 절차(`docs/guidance/branch-merge.md`)대로 `--no-ff` 사용.

**안 한 것**
없음

## 결과

**동작 확인**
`git merge --no-ff` 정상 완료, 충돌 없음

**리스크**
없음

**후속**
없음

**관련 문서**
[docs/guidance/branch-merge.md](../../guidance/branch-merge.md)
