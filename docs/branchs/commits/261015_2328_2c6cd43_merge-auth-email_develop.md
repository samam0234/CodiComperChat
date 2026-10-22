# merge: feature/auth-email into develop (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/auth-email into develop (no-ff)` |
| Full SHA | `2c6cd43c96d792292d82b614c6ad423b9a61cb74` |
| Short SHA | `2c6cd43` |
| Branch | `develop` |
| Parent | `367a1a5`, `ee4b1d4` |
| Date | 2026-10-15T23:28:12+09:00 |

## 주 내용

- `feature/auth-email`를 `develop`에 `--no-ff`로 병합
- 이메일 인증·비밀번호 찾기·비밀번호 변경 시 다른 기기 로그아웃

## 상세

**배경**
사용자 지시("아직 안 된 것 중 배포 빼고 전부 진행 → 디자인 개편 → 커밋 → 병합하고 푸시")에 따라 이메일 인증 → 이미지 검수 → 결제 → 공유 한도 → CI → 엄격 CSP → 디자인 개편 → 기록 목록 브랜치 8개를 쌓인 순서대로 병합한다.

**변경 범위**
apps/api(auth, mail, prisma), apps/web(인증 화면), e2e, docs

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
운영 메일 서비스 연결

**관련 문서**
[docs/guidance/branch-merge.md](../../guidance/branch-merge.md)
