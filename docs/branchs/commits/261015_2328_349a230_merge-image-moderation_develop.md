# merge: feature/image-moderation into develop (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/image-moderation into develop (no-ff)` |
| Full SHA | `349a230c9d293fe61bead7504876bdaa7754258a` |
| Short SHA | `349a230` |
| Branch | `develop` |
| Parent | `892107c`, `b0fde24` |
| Date | 2026-10-15T23:28:16+09:00 |

## 주 내용

- `feature/image-moderation`를 `develop`에 `--no-ff`로 병합
- 초상 자동 검수와 운영자 초상 검수 화면

## 상세

**배경**
사용자 지시("아직 안 된 것 중 배포 빼고 전부 진행 → 디자인 개편 → 커밋 → 병합하고 푸시")에 따라 이메일 인증 → 이미지 검수 → 결제 → 공유 한도 → CI → 엄격 CSP → 디자인 개편 → 기록 목록 브랜치 8개를 쌓인 순서대로 병합한다.

**변경 범위**
services/ai(moderate), apps/api(studio), apps/web(운영자 화면), e2e

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
부적절 그림 평가 묶음

**관련 문서**
[docs/guidance/branch-merge.md](../../guidance/branch-merge.md)
