# 웹 프록시 토큰과 운영에서 실제로 쓰는 환경변수 위치를 적는다

| 항목 | 내용 |
|------|------|
| Subject | `docs(env): 웹 프록시 토큰과 운영에서 실제로 쓰는 환경변수 위치를 적는다` |
| Full SHA | `9248c5d9ee14bc6330ff744641e96e3e797827d1` |
| Short SHA | `9248c5d` |
| Branch | `feature/docs-final-update` |
| Parent | `e1a3e16` |
| Date | 2026-11-07 09:53:53 +0900 |

## 주 내용

- `docs/guidance/environment.md` 웹 표에 `WEB_PROXY_TOKEN`을 더했다
- "운영에서 실제로 쓰는 값 (2026-11-07)" 절: Oracle 서버·Vercel 웹·Vercel 콘솔의 키와 비어 있는 키를 값 없이 정리했다

## 상세

**배경**
2026-11-07 배포에서 쓴 환경변수가 문서에 없었다.

**변경 범위**
`docs/guidance/environment.md`.

**기술 포인트**
값은 적지 않았다. `API_BASE_URL`의 `api.` 접두사를 강조했다.

**안 한 것**
없음.

## 결과

**동작 확인**
문서 수정만.

**리스크**
없음.

**후속**
없음.
