# develop into main

| 항목 | 내용 |
|------|------|
| Subject | `merge: develop into main` |
| Full SHA | `39a622ee10c03c0414acd98db230599337dd3bb7` |
| Short SHA | `39a622e` |
| Branch | `main` |
| Parent | `ed79db6, 96a6ab0` |
| Date | 2026-11-07 09:22:01 +0900 |

## 주 내용

- `feature/web-vercel-deploy`(Caddy 웹 프록시 토큰, 웹 Vercel 배포 상태 문서)를 main에 병합했다

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
