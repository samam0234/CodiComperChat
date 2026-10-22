# CSP 위반 보고를 받아 서버 로그에 남김

| 항목 | 내용 |
|------|------|
| Subject | `feat(web): CSP 위반 보고를 받아 서버 로그에 남김` |
| Full SHA | `638d4d50d64453e4dadaa20a3db3c8451974c4ac` |
| Short SHA | `638d4d5` |
| Branch | `feature/csp-report` |
| Parent | `a7696a0` (feature/moderation-evals) |
| Date | 2026-10-16T03:56:18+09:00 |

## 주 내용

- `proxy.ts`의 CSP에 `report-uri /api/csp-report`
- `app/api/csp-report/route.ts`(신규): 예전 형식(`csp-report`)과 Reporting API 형식(`csp-violation` 배열)을 받아 웹 서버 로그에 `[CSP 위반] 지시어 막음: 주소 · 화면: 주소` 한 줄
- 누구나 보낼 수 있는 주소라 본문 16KB 제한, 필요한 칸만 남기고 주소의 쿼리·조각은 버림, 1분 30줄 제한, 응답은 늘 204

## 상세

**배경**
사용자 요청("확인하지 못했거나 할 수 없는 것을 진행")의 하나(엄격 CSP의 "위반 보고 수집"). CSP가 새 외부 자원을 막아도 이용자 화면에서 조용히 깨질 뿐 알 방법이 없었다.

**변경 범위**
apps/web(proxy.ts, api/csp-report 신규), e2e/tests/security.spec.ts, docs

**기술 포인트**
- 처음에는 표준 권장대로 `report-uri`와 `report-to`(+ `Reporting-Endpoints` 헤더)를 함께 넣었다. 그런데 크롬은 `report-to`가 있으면 `report-uri`를 무시하고, `report-to`는 보고를 모아 늦게 보내는데 80초를 기다려도 이 환경(http)에서는 도착하지 않았다. 확인되지 않는 방식을 남기지 않고, 바로 보내는 `report-uri`만 쓴다.
- 실제 브라우저 전달을 시험으로 고정했다: 허용하지 않은 외부 그림을 넣어 위반을 만들고, 브라우저가 보낸 보고 요청과 204 응답을 잡는다.
- 로그에 토큰 같은 값이 남지 않게 주소의 쿼리를 버린다(시험의 `?token=secret`이 로그에 없는 것을 확인).

**안 한 것**
보고를 모아 보는 화면·알림(지금은 서버 로그), report-to(https 운영 환경에서 다시 검토)

## 결과

**동작 확인**
- 보안 e2e 8개 통과: 실제 위반 → 브라우저 보고 즉시 도착 → 204, 예전·새 형식 모두 로그 한 줄, 이상한 본문·큰 본문 204, 주요 화면 10곳 위반 0건 유지
- 웹 서버 로그에서 쿼리가 지워진 것 확인
- web tsc 통과

**리스크**
로그가 남는 곳은 웹 서버 콘솔이다 — 운영에서는 로그 수집에 연결해야 의미가 있다.

**후속**
운영 로그 수집에서 [CSP 위반] 알림

**관련 문서**
[docs/API_DOCUMENTATION.md](../../API_DOCUMENTATION.md)
