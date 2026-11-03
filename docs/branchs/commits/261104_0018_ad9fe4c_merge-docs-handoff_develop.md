# feature/docs-handoff into develop (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/docs-handoff into develop (no-ff)` |
| Full SHA | `ad9fe4c2b13dd2a06b06f04a8eb2e9dc3a9b0856` |
| Short SHA | `ad9fe4c` |
| Branch | `develop` |
| Parent | `3501523, b99e102` |
| Date | 2026-11-04 00:18:54 +0900 |

## 주 내용

- `feature/docs-handoff`를 `develop`에 `--no-ff`로 병합
- 그 아래 쌓여 있던 premium-adapters, docs-model-license, deploy-server-setup, adult-mode-switch, pro-click, premium-age-gate, private-repo-decisions가 함께 들어갔다
- 프리미엄 모델 연동, 성인 모드 스위치, 클릭 프로, 만 18세 나이 잠금, 배포 준비, 인수인계 문서가 개발 통합 브랜치에 반영됐다

## 상세

**배경**
사용자가 develop 병합과 푸시를 요청했다. 브랜치가 한 줄로 쌓여 있어 맨 위만 병합하면 아래 작업이 모두 들어간다.

**변경 범위**
apps/api, apps/web, services/ai, deploy, docs

**기술 포인트**
`git merge --no-ff feature/docs-handoff`. 충돌은 없었다.

**안 한 것**
main 병합. LICENSE 문구. 전체 e2e는 111/112라 이전에는 보류했으나, 이번 요청으로 병합했다.

## 결과

**동작 확인**
병합 커밋 생성, 충돌 없음

**리스크**
전체 e2e 1건(webtoon.spec.ts:95)은 부하에서만 실패했고 따로 돌리면 통과했다. 시간 제한은 늘리지 않았다.

**후속**
origin/develop 푸시

**관련 문서**
[docs/guidance/branch-merge.md](../../guidance/branch-merge.md)
[docs/find_debug/2026-11-03.md](../../find_debug/2026-11-03.md)
