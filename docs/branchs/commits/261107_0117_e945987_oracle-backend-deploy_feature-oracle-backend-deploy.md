# Oracle Cloud ARM 서버에 백엔드만 올리는 구성 추가

| 항목 | 내용 |
|------|------|
| Subject | `feat(deploy): Oracle Cloud ARM 서버에 백엔드만 올리는 구성 추가` |
| Full SHA | `e94598783ea631f41e1d8846507ede0b2af2d035` |
| Short SHA | `e945987` |
| Branch | `feature/oracle-backend-deploy` |
| Parent | `a58c0e7` |
| Date | 2026-11-07 01:17:26 +0900 |

## 주 내용

- GPU 없는 Oracle Cloud A1.Flex(ARM)에 caddy·api·postgres·migrate만 올리는 `deploy/oracle/`을 더했다
- 서버 준비 스크립트가 도커를 설치하고 `.env` 비밀값을 서버에서 만든다(화면에 찍지 않는다)
- 절차 문서 `docs/web_management/oracle-backend.md`

## 상세

**배경**
사용자가 Oracle Cloud 인스턴스(도쿄, Ubuntu 24.04)에 백엔드를 올리라고 했다(2026-11-07). API+DB만, 프론트는 따로, 도메인은 없다고 골랐다.

**변경 범위**
`deploy/oracle/docker-compose.yml`, `Caddyfile`, `.env.example`, `server-setup.sh`, 문서 1개.

**기술 포인트**
운영 안전 검사가 `REQUIRE_HTTPS=1`을 요구하므로 도메인 대신 `api.168-110-61-178.sslip.io`로 인증서를 받는다. 메일은 비어도 API가 뜨게 선택값으로 바꿨다. AI 서버는 없지만 `AI_SERVICE_TOKEN`은 안전 검사 때문에 둔다.

**안 한 것**
기존 GPU 운영 구성과 결정(Hetzner)은 건드리지 않았다.

## 결과

**동작 확인**
`docker compose config` 통과(필수 비밀값이 비면 거부하는 것도 확인), `bash -n` 통과. 서버에서는 아직 돌리지 않았다.

**리스크**
ARM 서버에서 이미지 빌드는 아직 확인 전.

**후속**
SSH 키 등록 뒤 실제 배포.
