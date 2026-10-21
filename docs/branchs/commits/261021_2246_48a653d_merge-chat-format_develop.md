# merge: feature/chat-format into develop (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/chat-format into develop (no-ff)` |
| Full SHA | `48a653d42ca4038fd42f6db3a86df952dad61918` |
| Short SHA | `48a653d` |
| Branch | `develop` |
| Parent | `8e564c7`, `893db7a` |
| Date | 2026-10-21T22:46:34+09:00 |

## 주 내용

- `feature/chat-format`를 `develop`에 `--no-ff`로 병합
- 대화 글 꾸미기 표기(마크다운 비슷한 명령), {{user}} 치환

## 상세

**배경**
사용자 지시("일단 병합 ㄱㄱ … 푸시까지")에 따라 쌓여 있던 모델 선택 → 코레딧·명령어 → 글 꾸미기 브랜치를 순서대로 병합했다.

**변경 범위**
apps/web(chat-format·chat-text), services/ai, e2e, docs

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
없음

**관련 문서**
[docs/guidance/branch-merge.md](../../guidance/branch-merge.md)
