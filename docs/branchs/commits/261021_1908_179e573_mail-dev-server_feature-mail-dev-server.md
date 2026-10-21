# 개발용 메일 서버(Mailpit)를 docker compose에 추가

| 항목 | 내용 |
|------|------|
| Subject | `feat(infra): 개발용 메일 서버(Mailpit)를 docker compose에 추가` |
| Full SHA | `179e57399dde56a0306072d57e1482bc8f3b0c85` |
| Short SHA | `179e573` |
| Branch | `feature/mail-dev-server` |
| Parent | `a1ca647` (develop) |
| Date | 2026-10-21T19:08:09+09:00 |

## 주 내용

- docker-compose.yml에 `mailpit` 서비스: SMTP `127.0.0.1:1025`, 받은 메일 웹 화면 `127.0.0.1:8025`. 밖으로는 보내지 않고 받아 둔다
- 개발자 PC의 `apps/api/.env`에 `MAIL_SMTP_URL=smtp://127.0.0.1:1025`, `WEB_BASE_URL=http://localhost:3000` (git 제외 파일이라 커밋에는 없음)
- `apps/api/.env.example`·시작하기·환경변수·docker-run·스택·포트 문서에 개발 메일 서버 안내

## 상세

**배경**
사용자 요청("메일 서비스는 실행하고"). 메일 모듈은 있었지만 SMTP 서버가 없어 개발 중에는 메일이 로그에만 찍혔다. 실제 메일 서비스 계정은 아직 없으므로, 로컬에서 진짜 SMTP로 주고받는 메일 서버를 띄웠다. 결제는 사용자 결정으로 보류.

**변경 범위**
docker-compose.yml, apps/api/.env.example, docs(guidance, plan, web_management)

**기술 포인트**
- Mailpit을 고른 이유: 한 컨테이너로 SMTP와 받은 메일 웹 화면·API를 함께 주고, 밖으로 보내지 않아 개발 중 실수로 남에게 메일이 가지 않는다.
- 처음 `smtp://localhost:1025`로 했더니 `ECONNREFUSED ::1:1025` — Windows에서 localhost가 IPv6로 먼저 풀리는데 컨테이너 포트는 127.0.0.1(IPv4)에만 열었다. 주소를 127.0.0.1로 고정하고 문서에 이유를 적었다.
- compose의 `postgres` 서비스는 설치형 PostgreSQL과 5432가 겹치므로, `docker compose up -d mailpit`처럼 서비스 이름을 붙여 메일 서버만 띄운다.
- Docker Desktop이 꺼져 있어 켰다.

**안 한 것**
운영 메일 서비스 연결(계정 필요), 쓰고 있는 개발 API 서버 재시작(.env를 새로 읽으려면 필요 — 사용자가 직접)

## 결과

**동작 확인**
- `npm run mail:check --workspace api -- check@example.com` → `250 Ok: queued`, Mailpit API에서 받은 메일 확인
- 임시 API(4201, e2e DB, 지금 코드)로 가입 → "이메일 주소를 확인해 주세요", 비밀번호 찾기 → "비밀번호 재설정 링크" 두 메일이 Mailpit에 도착(보낸 사람·링크 주소 정상)

**리스크**
Docker Desktop이 꺼지면 메일 발송이 실패한다(가입은 성공하고 오류 로그만 남는다).

**후속**
운영 메일 서비스 정하기

**관련 문서**
[docs/guidance/getting-started.md](../../guidance/getting-started.md), [docs/guidance/environment.md](../../guidance/environment.md)
