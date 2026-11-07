# Caddy가 웹(Vercel)이 넘긴 이용자 IP를 공유 비밀로 믿게 한다

| 항목 | 내용 |
|------|------|
| Subject | `feat(deploy): Caddy가 웹(Vercel)이 넘긴 이용자 IP를 공유 비밀로 믿게 한다` |
| Full SHA | `7a0d58c19b4ae21fdd7b1503bc2be4d7523f0072` |
| Short SHA | `7a0d58c` |
| Branch | `feature/web-vercel-deploy` |
| Parent | `ed79db6` |
| Date | 2026-11-07 09:20:11 +0900 |

## 주 내용

- Caddy가 웹(Vercel)이 넘긴 실제 이용자 IP를 `WEB_PROXY_TOKEN`으로 믿게 했다

## 상세

**배경**
사용자가 웹도 올리라고 했다(2026-11-07). 웹은 Vercel에서 서버로 API를 부르므로 API가 보는 주소가 늘 Vercel이라 IP 기준 한도(로그인·가입)가 모든 이용자를 한 명으로 센다.

**변경 범위**
`deploy/oracle/Caddyfile`, `docker-compose.yml`(caddy에 `WEB_PROXY_TOKEN` 필수 값), `.env.example`.

**기술 포인트**
토큰이 맞는 요청만 `X-Forwarded-For`를 그대로 넘기고 나머지는 덮어쓴다. 빈 값이 모든 요청과 맞는 것을 막으려고 compose에서 비면 시작하지 않게 했다. 서버의 caddy 이미지로 `caddy validate` 통과.

**안 한 것**
토큰 값은 저장소·문서에 없다. 서버 `.env`와 Vercel 환경변수(sensitive)에만 있다.

## 결과

**동작 확인**
서버에서 caddy 재시작 후 `/health` 200. 올바른 토큰과 틀린 토큰 모두 200으로 응답한다(헬스는 IP를 쓰지 않음). 토큰이 IP 판단에 실제로 쓰이는지는 확인하지 못했다.

**리스크**
토큰이 대화 기록에 한 번 남았다. 필요하면 서버 `.env`와 Vercel 값을 같이 바꿔 교체한다.

**후속**
웹 배포 확인, Vercel 로그인 보호 해제 여부 결정(사용자).
