# AI 단위 시험과 기록 작성기 시험을 CI에 추가

| 항목 | 내용 |
|------|------|
| Subject | `ci(infra): AI 단위 시험과 기록 작성기 시험을 CI에 추가` |
| Full SHA | `600c9e637764357938dee29f1be60de46f85fabe` |
| Short SHA | `600c9e6` |
| Branch | `feature/ci-more-tests` |
| Parent | `534af0c` |
| Date | 2026-11-04 04:42:37 +0900 |

## 주 내용

- AI 단위 시험과 커밋 기록 작성기 시험을 CI와 로컬 CI 재현에 넣었다

## 상세

**배경**
두 시험이 있었지만 CI가 돌리지 않아 깨져도 알 수 없었다.

**변경 범위**
`.github/workflows/ci.yml`, `scripts/ci-local.mjs`, `docs/plan/TESTING.md`.

**기술 포인트**
없음.

**안 한 것**
실제 모델이 필요한 `evals`는 넣지 않았다.

## 결과

**동작 확인**
전체 린트 통과, AI 시험 22개와 작성기 시험 6개 통과. `npm run ci:local -- checks`는 별도로 돌린다. GitHub Actions에서는 돌려 보지 않았다.

**리스크**
없음.

**후속**
없음.

**관련 문서**
[TESTING.md](../../plan/TESTING.md)
