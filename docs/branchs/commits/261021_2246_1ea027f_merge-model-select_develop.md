# merge: feature/model-select into develop (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/model-select into develop (no-ff)` |
| Full SHA | `1ea027fe4f3f7fdd5e644618bac7b46c7a104bfb` |
| Short SHA | `1ea027f` |
| Branch | `develop` |
| Parent | `749aeb6`, `cbb5953` |
| Date | 2026-10-21T22:46:26+09:00 |

## 주 내용

- `feature/model-select`를 `develop`에 `--no-ff`로 병합
- 대화마다 모델 고르기(기본·강화 무료, 프리미엄 잠금), 하루 횟수 한도, 개발 DB 마이그레이션 chat_model

## 상세

**배경**
사용자 지시("일단 병합 ㄱㄱ … 푸시까지")에 따라 쌓여 있던 모델 선택 → 코레딧·명령어 → 글 꾸미기 브랜치를 순서대로 병합했다.

**변경 범위**
apps/api(models), services/ai, apps/web, e2e, docs

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
코레딧·명령어 병합

**관련 문서**
[docs/guidance/branch-merge.md](../../guidance/branch-merge.md)
