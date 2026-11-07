# feature/web-vercel-deploy into develop

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/web-vercel-deploy into develop` |
| Full SHA | `96a6ab0ca6dcd21c776cca76ada21336703b726a` |
| Short SHA | `96a6ab0` |
| Branch | `develop` |
| Parent | `f027a56, f5a00e3` |
| Date | 2026-11-07 09:21:57 +0900 |

## 주 내용

- `feature/web-vercel-deploy`(Caddy 웹 프록시 토큰, 웹 Vercel 배포 상태 문서)를 병합했다

## 상세

**배경**
사용자가 병합과 푸시를 요청했다(2026-11-07). 같은 변경으로 서버 Caddy와 Vercel 웹이 이미 배포돼 있다.

**변경 범위**
`deploy/oracle/Caddyfile`·`docker-compose.yml`·`.env.example`, `docs/DEPLOYMENT.md`, `docs/web_management/oracle-backend.md`, 커밋 기록 2개.

**안 한 것**
운영 콘솔 연결.

## 결과

**동작 확인**
변경이 배포 설정과 문서뿐이라 코드 시험은 돌리지 않았다. 서버 `/health` 200, 웹 화면에서 API 캐릭터 렌더링은 배포 때 확인했다.

**리스크**
없음.

**후속**
콘솔 연결, SMTP.
