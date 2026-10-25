# merge: develop into main (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: develop into main (no-ff)` |
| Full SHA | `febb852f503d3de1ce875e755d1c1687dba9c349` |
| Short SHA | `febb852` |
| Branch | `main` |
| Parent | `46a6155`, `b12035b` |
| Date | 2026-10-25T22:05:10+09:00 |

## 주 내용

- `develop` 브랜치 변경사항을 `main`에 `--no-ff`로 병합
- 공개 전 안전 강화(성인 콘텐츠 가드, 신고/차단 운영, HTTPS/내부 인증 보호)와 관련 문서 업데이트를 운영 브랜치에 통합
- 병합 중 `docs/branchs/README.md` 충돌 1건을 정리하고 병합 완료

## 상세

**배경**
사용자 요청에 따라 `develop`에 반영된 최신 기능과 안전 패치를 `main`에도 반영했다.

**변경 범위**
apps/web, apps/api, services/ai, console, prisma migration, docs 전반

**기술 포인트**
브랜치 규칙에 맞춰 `git merge --no-ff develop`로 병합했다. 충돌은 커밋 목록 문서(`docs/branchs/README.md`) 1개에서만 발생했고 수동 병합으로 해결했다.

**안 한 것**
별도 기능 추가 개발은 하지 않았다.

## 결과

**동작 확인**
병합 커밋 생성 완료 (`febb852`)

**리스크**
원격 반영 전이므로 배포 브랜치와 원격 `main`은 아직 동일하지 않을 수 있다.

**후속**
`origin/main` 푸시

**관련 문서**
[docs/guidance/branch-merge.md](../../guidance/branch-merge.md)  
[261025_2126_fd64c48_merge-launch-safety_develop.md](./261025_2126_fd64c48_merge-launch-safety_develop.md)
