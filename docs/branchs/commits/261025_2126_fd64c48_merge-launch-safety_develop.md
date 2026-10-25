# merge: feature/launch-safety into develop (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/launch-safety into develop (no-ff)` |
| Full SHA | `fd64c4886666f4f38fd13351a7c0a37f0e417908` |
| Short SHA | `fd64c48` |
| Branch | `develop` |
| Parent | `d8bd1db`, `d4e8af2` |
| Date | 2026-10-25T21:26:17+09:00 |

## 주 내용

- `feature/launch-safety`를 `develop`에 `--no-ff`로 병합
- 성인 이미지 차단 보강(미성년자·실사 유사도), 신고/차단 운영 흐름, HTTPS/FastAPI 내부 보호, 운영 안전 가드 반영
- 관련 문서(SECURITY, API/배포/운영 문서)와 마이그레이션 포함 변경을 통합

## 상세

**배경**
공개 전 필수 안전 작업(법/운영 가드, 보안 가드, 운영 처리 흐름)을 완료한 브랜치를 개발 통합 브랜치에 반영하기 위해 병합했다.

**변경 범위**
apps/api(prisma 마이그레이션, content-reports, https/production safety), apps/web(신고 UI, HTTPS 프록시), console(그림 신고 보드), services/ai(internal auth, moderation), docs 및 docker-compose

**기술 포인트**
브랜치 규칙에 따라 `develop`에서 `git merge --no-ff feature/launch-safety`로 병합해 이력을 보존했다. 병합 충돌은 없었다.

**안 한 것**
원격 푸시 및 `main` 병합은 진행하지 않았다.

## 결과

**동작 확인**
`git merge --no-ff` 정상 완료, 충돌 없음

**리스크**
TLS 인증서 발급/배치, 운영 비밀값 실제 발급, Gemma 성인 모드 정책 확정은 후속 항목으로 남아 있다.

**후속**
사용자 확인 후 원격 `develop` 푸시 여부 결정

**관련 문서**
[SECURITY.md](../../../SECURITY.md)  
[docs/guidance/branch-merge.md](../../guidance/branch-merge.md)  
[261025_1917_bd6bbe0_launch-safety_feature-launch-safety.md](./261025_1917_bd6bbe0_launch-safety_feature-launch-safety.md)
