# merge: feature/photonet-rating into develop (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/photonet-rating into develop (no-ff)` |
| Full SHA | `faaa70878070e78b48bb133f4205ce89fb359096` |
| Short SHA | `faaa708` |
| Branch | `develop` |
| Parent | `2c02951`, `f1d40b6` |
| Date | 2026-10-24T19:53:59+09:00 |

## 주 내용

- `feature/photonet-rating`를 `develop`에 `--no-ff`로 병합
- 코디포토넷 전체 이용가·성인 모드, 성인 확인(임시), 성인 그림체·검수 손질

## 상세

**배경**
사용자 지시("develop 병합")에 따라 쌓여 있던 feature 브랜치를 순서대로 병합했다.

**변경 범위**
apps/api(account, operations, prisma), services/ai(photonet, moderation), apps/web(설정·코디포토넷), e2e, docs

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
secret-quest 병합

**관련 문서**
[docs/guidance/branch-merge.md](../../guidance/branch-merge.md)
