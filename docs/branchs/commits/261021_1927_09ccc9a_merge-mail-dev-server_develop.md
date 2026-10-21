# merge: feature/mail-dev-server into develop (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/mail-dev-server into develop (no-ff)` |
| Full SHA | `09ccc9ad2a7ceb67b49b2afc6fe9674b07f8d573` |
| Short SHA | `09ccc9a` |
| Branch | `develop` |
| Parent | `a1ca647`, `6eb4fb6` |
| Date | 2026-10-21T19:27:50+09:00 |

## 주 내용

- `feature/mail-dev-server`를 `develop`에 `--no-ff`로 병합
- docker compose에 Mailpit(SMTP 1025, 화면 8025)을 넣어 가입 인증·비밀번호 재설정 메일을 개발 중에 실제로 받아 볼 수 있게 함

## 상세

**배경**
사용자 지시("메일 서비스는 실행하고 … 운영자 전용 콘솔서버도 만들어", 작업 뒤 병합·푸시)에 따라 메일 개발 서버 → 운영 콘솔 브랜치 순서로 병합했다.

**변경 범위**
docker-compose.yml, docs/

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
운영 콘솔 병합

**관련 문서**
[docs/guidance/branch-merge.md](../../guidance/branch-merge.md)
