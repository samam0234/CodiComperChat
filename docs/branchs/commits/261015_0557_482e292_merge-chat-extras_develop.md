# merge: feature/chat-extras into develop (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/chat-extras into develop (no-ff)` |
| Full SHA | `482e292db21dab0023b7a53040292191ed15c144` |
| Short SHA | `482e292` |
| Branch | `develop` |
| Parent | `acb0cd0`, `d5cc717` |
| Date | 2026-10-15T05:57:01+09:00 |

## 주 내용

- `feature/chat-extras`를 `develop`에 `--no-ff`로 병합
- 엑스트라 설정(내 조연 카드, 대화별 적용, 인물 관계·상황·장소·모두 조건 등장, 환각 방지)

## 상세

**배경**
사용자 지시("일단 커밋 작업 하고 나서 최종적으로 병합한 다음 푸시까지")에 따라 새로하기·이어하기 → 엑스트라 → 공개 범위 → 프롬프트 연장 브랜치 4개를 쌓인 순서대로 병합했다.

**변경 범위**
apps/api(extras 모듈, prisma, character-chat), services/ai(context, inference, suggestion), apps/web(엑스트라 패널), docs

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
다음 브랜치 병합

**관련 문서**
[docs/guidance/branch-merge.md](../../guidance/branch-merge.md)
