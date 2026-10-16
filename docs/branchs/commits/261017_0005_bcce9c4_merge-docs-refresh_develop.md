# merge: feature/docs-refresh into develop (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/docs-refresh into develop (no-ff)` |
| Full SHA | `bcce9c43c710a838b1cb5a418f55492293b20e12` |
| Short SHA | `bcce9c4` |
| Branch | `develop` |
| Parent | `f394696`, `539fd2c` |
| Date | 2026-10-17T00:05:55+09:00 |

## 주 내용

- `feature/docs-refresh`를 `develop`에 `--no-ff`로 병합
- docs/ 전체를 실제 구현에 맞춤(plan·Architecture·guidance·허브·배포 준비·디버그 일지)

## 상세

**배경**
사용자 지시(".env 적용 → 커밋 → 문서 업데이트 → 커밋 → 병합하고 푸시")에 따라 AI 환경변수 안내 → 문서 갱신 브랜치 2개를 쌓인 순서대로 병합한다.

**변경 범위**
docs/, apps/api/scripts/user-role.mjs(주석)

**기술 포인트**
표준 병합 절차(`docs/guidance/branch-merge.md`)대로 `--no-ff` 사용. 브랜치가 앞 브랜치 위에 쌓여 있어 순서대로 합치면 충돌이 없다.

**안 한 것**
없음

## 결과

**동작 확인**
`git merge --no-ff` 정상 완료, 충돌 없음

**리스크**
없음

**후속**
배포 대상이 정해지면 배포 절차

**관련 문서**
[docs/guidance/branch-merge.md](../../guidance/branch-merge.md)
