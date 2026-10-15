# merge: feature/studio-portrait into develop (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/studio-portrait into develop (no-ff)` |
| Full SHA | `385b714e2db78870704c99c7576bc9350c60ab3d` |
| Short SHA | `385b714` |
| Branch | `develop` |
| Parent | `e58b983`, `ac1730f` |
| Date | 2026-10-15T11:37:30+09:00 |

## 주 내용

- `feature/studio-portrait`를 `develop`에 `--no-ff`로 병합
- 캐릭터 흉상 초상 이미지(업로드·검사·표시)

## 상세

**배경**
사용자 지시("병합하고 푸시")에 따라 개인사 가드 → 말투 샘플 → 신고 → AI 초안 → 캠페인 상태 → 초상 브랜치 6개를 쌓인 순서대로 병합했다.

**변경 범위**
apps/api(studio, characters, prisma, main.ts), apps/web(공방·목록·상세·채팅·이미지 중계), docs

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
git push origin develop

**관련 문서**
[docs/guidance/branch-merge.md](../../guidance/branch-merge.md)
