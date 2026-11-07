# 배포 구성(Vercel·Netlify, Rails+Flask compose)과 포트폴리오 안내를 더한다

| 항목 | 내용 |
|------|------|
| Subject | `feat(portfolio): 배포 구성(Vercel·Netlify, Rails+Flask compose)과 포트폴리오 안내를 더한다` |
| Full SHA | `fcbb9eb10a41e67a12942ec08ceb7fb3d430c6fb` |
| Short SHA | `fcbb9eb` |
| Branch | `feature/portfolio` |
| Parent | `a054276` |
| Date | 2026-11-07 20:50:19 +0900 |

## 주 내용

- 사이트 배포 설정: `frontend/vercel.json`, `frontend/netlify.toml`(빌드 환경변수 `PUBLIC_API_BASE`)
- 서버 배포: `server/docker-compose.yml`(caddy · backend · ai, 선택 `--profile ollama`), `server/Caddyfile`, `server/.env.example`
- `Gemfile.lock`에 `aarch64-linux` 플랫폼(ARM 서버), `PortFolio/.gitattributes`(컨테이너 스크립트 LF), `PortFolio/README.md`

## 상세

**배경**
사용자가 프론트는 Vercel이나 Netlify, 백엔드와 AI 서버는 둘을 묶어 함께 배포하라고 했다(2026-11-07).

**변경 범위**
배포 설정 파일과 안내 문서.

**기술 포인트**
바깥에는 Caddy만 열고 Flask·Ollama는 내부망에 둔다. Rails는 `FORCE_SSL`로 TLS 앞단을 가정하고 `/up`은 리다이렉트하지 않는다. 비밀값은 `.env`에만 둔다.

**안 한 것**
실제 배포(공개 주소가 생기는 일이라 하지 않음), 이미지 빌드(이 PC의 Docker가 꺼져 있음).

## 결과

**동작 확인**
`docker compose --env-file <임시 값> config` 통과, `node scripts/check-mermaid.mjs` 실패 0.

**리스크**
이미지 빌드를 해 보지 않았다.

**후속**
웹 푸터 '프로젝트 소개', 노션, 병합.
