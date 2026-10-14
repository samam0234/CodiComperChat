# merge: feature/studio-visibility into develop (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/studio-visibility into develop (no-ff)` |
| Full SHA | `af90d1972541879f179092474ce590737a2a9b18` |
| Short SHA | `af90d19` |
| Branch | `develop` |
| Parent | `79bdbc7`, `7f6bce1` |
| Date | 2026-10-15T05:57:06+09:00 |

## 주 내용

- `feature/studio-visibility`를 `develop`에 `--no-ff`로 병합
- 캐릭터 공개 범위(공개·링크 공개·비공개)와 누구나 발행, 비공개 조회 규칙

## 상세

**배경**
사용자 지시("일단 커밋 작업 하고 나서 최종적으로 병합한 다음 푸시까지")에 따라 새로하기·이어하기 → 엑스트라 → 공개 범위 → 프롬프트 연장 브랜치 4개를 쌓인 순서대로 병합했다.

**변경 범위**
apps/api(prisma, characters, studio, 대화 계열), apps/web(공방, 캐릭터 상세·채팅), services/ai(assist), docs

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
