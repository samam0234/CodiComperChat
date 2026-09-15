# feature/monorepo-scaffold → develop 병합

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/monorepo-scaffold into develop (no-ff)` |
| Full SHA | `29cf9663ff6d038d7e384c8d8e7ee5e8caf9774c` |
| Short SHA | `29cf966` |
| Branch | `develop` |
| Parent | `8d6db5d` (develop), `6108b6c` (feature/monorepo-scaffold) |
| Date | 2026-09-15 18:47:36 +0900 |

## 주 내용

- `feature/monorepo-scaffold`의 커밋 2개(`884633c`, `6108b6c`)를 `develop`에 `--no-ff`로 병합
- npm workspaces 모노레포와 `apps/web` 전역 셸이 develop에 반영됨

## 상세

**배경**
웹 전역 셸(헤더·드로어·푸터)과 라우트 11개 작업이 끝나, 백엔드(`apps/api`) 작업을 새 브랜치에서 시작하기 전에 develop으로 합류시켰다. 루트 `package.json`의 workspaces 설정이 develop에 있어야 `apps/api`를 추가하는 후속 브랜치가 충돌 없이 갈라진다.

**변경 범위**
`apps/web/` 전체, 루트 `package.json`/`package-lock.json`, 문서 7종.

**기술 포인트**
`--no-ff`로 병합해 웹 셸 작업 단위가 그래프에 하나의 병합 지점으로 남게 함.

**안 한 것**
`main` 병합은 하지 않음 — 배포 통합 전용이며 아직 배포 대상이 없다.

## 결과

**동작 확인**
병합 충돌 없음. 그래프에서 분기·합류 형태 유지 확인.

**리스크**
웹 셸의 브라우저 육안 확인은 아직 사람이 하지 않은 상태로 병합됨 (`884633c` 기록의 리스크 항목 참고).

**후속**
`feature/api-scaffold`에서 Nest.js 백엔드 뼈대 작업.

**관련 문서**
`docs/branchs/BRANCH_MAP.md`, `docs/guidance/branch-merge.md`
