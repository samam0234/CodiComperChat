# merge: feature/security-hardening into develop (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/security-hardening into develop (no-ff)` |
| Full SHA | `2f998d23f9998a2957e33e7316a3aa7e9f4b7229` |
| Short SHA | `2f998d2` |
| Branch | `develop` |
| Parent | `dbd384d`, `15f931e` |
| Date | 2026-10-15T13:12:38+09:00 |

## 주 내용

- `feature/security-hardening`를 `develop`에 `--no-ff`로 병합
- 요청 한도·로그인 제한·보안 헤더·약관 초안

## 상세

**배경**
사용자 지시("병합하고 푸시")에 따라 AI 품질 평가 → 웹 e2e → 보안·운영 → 프로 등급 → 성능 브랜치 5개를 쌓인 순서대로 병합한다.

**변경 범위**
apps/api(security, auth), apps/web(약관 페이지, client-ip), docs

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
법률 검토, 엄격 CSP

**관련 문서**
[docs/guidance/branch-merge.md](../../guidance/branch-merge.md)
