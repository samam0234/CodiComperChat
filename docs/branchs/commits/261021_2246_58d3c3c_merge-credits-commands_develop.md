# merge: feature/credits-commands into develop (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/credits-commands into develop (no-ff)` |
| Full SHA | `58d3c3cb495262d1a429e50c63a9e31b0ca59cf0` |
| Short SHA | `58d3c3c` |
| Branch | `develop` |
| Parent | `9888743`, `39562b2` |
| Date | 2026-10-21T22:46:30+09:00 |

## 주 내용

- `feature/credits-commands`를 `develop`에 `--no-ff`로 병합
- 대화 명령어(/다시·/계속·/되돌리기·/상황), 코레딧(출석·프리미엄 모델 값 1.5배), 강화 무료 프로 무제한

## 상세

**배경**
사용자 지시("일단 병합 ㄱㄱ … 푸시까지")에 따라 쌓여 있던 모델 선택 → 코레딧·명령어 → 글 꾸미기 브랜치를 순서대로 병합했다.

**변경 범위**
apps/api(credits·models·character-chat), apps/web, e2e, docs

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
글 꾸미기 병합

**관련 문서**
[docs/guidance/branch-merge.md](../../guidance/branch-merge.md)
