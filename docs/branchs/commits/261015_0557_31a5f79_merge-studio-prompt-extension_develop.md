# merge: feature/studio-prompt-extension into develop (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/studio-prompt-extension into develop (no-ff)` |
| Full SHA | `31a5f7917727c36b7ab36c049289bec193e7b1a2` |
| Short SHA | `31a5f79` |
| Branch | `develop` |
| Parent | `aca2098`, `bc5a249` |
| Date | 2026-10-15T05:57:13+09:00 |

## 주 내용

- `feature/studio-prompt-extension`를 `develop`에 `--no-ff`로 병합
- 긴 글 칸 프롬프트 연장 버튼(프로 등급 안내 상자)

## 상세

**배경**
사용자 지시("일단 커밋 작업 하고 나서 최종적으로 병합한 다음 푸시까지")에 따라 새로하기·이어하기 → 엑스트라 → 공개 범위 → 프롬프트 연장 브랜치 4개를 쌓인 순서대로 병합했다.

**변경 범위**
apps/web(공방 폼, 공용 확인 상자), services/ai(assist), docs/plan/NAVIGATION_IA.md

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
`git push origin develop`

**관련 문서**
[docs/guidance/branch-merge.md](../../guidance/branch-merge.md)
