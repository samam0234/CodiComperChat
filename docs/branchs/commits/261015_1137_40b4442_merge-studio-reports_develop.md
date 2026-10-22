# merge: feature/studio-reports into develop (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/studio-reports into develop (no-ff)` |
| Full SHA | `40b444283bb3d4365d906645290b9eab40b26550` |
| Short SHA | `40b4442` |
| Branch | `develop` |
| Parent | `1b94af9`, `88ea9d1` |
| Date | 2026-10-15T11:37:09+09:00 |

## 주 내용

- `feature/studio-reports`를 `develop`에 `--no-ff`로 병합
- 캐릭터 신고와 운영자 신고함(내리기·기각·복구), 시각 포맷 하이드레이션 수정

## 상세

**배경**
사용자 지시("병합하고 푸시")에 따라 개인사 가드 → 말투 샘플 → 신고 → AI 초안 → 캠페인 상태 → 초상 브랜치 6개를 쌓인 순서대로 병합했다.

**변경 범위**
apps/api(reports, auth, characters, studio), apps/web(신고·신고함·공방), docs

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
