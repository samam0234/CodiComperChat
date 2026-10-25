# merge: feature/official-iseyeon into develop (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/official-iseyeon into develop (no-ff)` |
| Full SHA | `8603bf26fe8646edc674fe9673a6652987e84170` |
| Short SHA | `8603bf2` |
| Branch | `develop` |
| Parent | `f778708`, `0f7370e` |
| Date | 2026-10-25T05:31:40+09:00 |

## 주 내용

- `feature/official-iseyeon`를 `develop`에 `--no-ff`로 병합
- 공식 캐릭터 이세연·추천 프로필·유지성/이세연 초상·공방 AI 초상 만들기(25 코레딧)

## 상세

**배경**
사용자 지시("develop 병합")에 따라 이세연 브랜치를 병합했다. 푸시는 하지 않았다.

**변경 범위**
apps/api(prisma 추천 프로필·시드·초상, studio AI 초상, credits, rate-limit), services/ai(portrait), apps/web(추천 프로필 카드, 공방 AI 초상 패널), e2e, docs

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
푸시(사용자 확인 후)

**관련 문서**
[docs/guidance/branch-merge.md](../../guidance/branch-merge.md)
