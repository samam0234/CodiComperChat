# 콘솔 README에 Vercel 현황과 API 연결 조건을 적는다

| 항목 | 내용 |
|------|------|
| Subject | `docs(console): 콘솔 README에 Vercel 현황과 API 연결 조건을 적는다` |
| Full SHA | `1f835119812a6f37d68ccbda5aaec8df62e90751` |
| Short SHA | `1f83511` |
| Branch | `feature/docs-gap-fill` |
| Parent | `db903ce` |
| Date | 2026-11-07 14:14:32 +0900 |

## 주 내용

- `console/README.md`에 "Vercel에 올릴 때 (아직 API에 연결 안 됨)" 절을 더했다: 지금 있는 값과 없는 값(`API_BASE_URL`·`CONSOLE_IP_ALLOWLIST`), 연결할 때의 값
- 앞단 Caddy가 없어 IP 거르기가 앱 한 겹뿐이라는 점과 확인하지 못한 가정(Vercel의 `X-Forwarded-For` 덮어쓰기)을 적었다

## 상세

**배경**
콘솔 Vercel 프로젝트가 있으나 API에 연결되지 않은 상태가 문서에 없었다.

**변경 범위**
`console/README.md`.

**안 한 것**
Vercel 설정 변경, 콘솔 연결(허용 IP는 사용자가 정한다).

## 결과

**동작 확인**
문서 수정만.

**리스크**
허용 IP 없이 공개 호스트에서 열면 403이다. `CONSOLE_ALLOW_PUBLIC`은 켜지 말라고 적었다.

**후속**
TASKS U08, T04.
