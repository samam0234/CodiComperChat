# DB 한도 저장소가 몰린 요청에 창보다 긴 Retry-After를 주던 문제 고침

| 항목 | 내용 |
|------|------|
| Subject | `fix(security): DB 한도 저장소가 몰린 요청에 창보다 긴 Retry-After를 주던 문제 고침` |
| Full SHA | `9283d28c82bb4dc88145f2c1ba483047c51925f6` |
| Short SHA | `9283d28` |
| Branch | `fix/test-load-stability` |
| Parent | `d8bd0aa` (fix/test-load-stability) |
| Date | 2026-10-16T03:40:00+09:00 |

## 주 내용

- `rate-store.ts`: 시각을 `now()` 대신 `clock_timestamp()`로
- `Retry-After`는 창 길이를 넘지 않게 상한
- 시험: 저장소가 DB 오류로 통과시키면(fail-open) 경고 로그를 잡아 시험을 실패시킴

## 상세

**배경**
부하 재현 중 "서버 두 대가 동시에 50번 세도 한도 10번만" 시험이 한 번 "Retry-After 61초(창 60초)"로 실패했다.

**변경 범위**
apps/api/src/security(rate-store, 시험), docs/API_DOCUMENTATION.md

**기술 포인트**
- 원인: Postgres의 `now()`는 트랜잭션 시작 시각이다. 같은 키에 몰린 요청이 행 잠금을 기다리는 동안 다른 요청이 먼저 창을 만들면, 기다리던 요청은 창 시작보다 이른 시각을 보고 남은 시간을 창보다 길게 계산했다. `clock_timestamp()`는 실제 현재 시각이라 이 어긋남이 없다. 실제 이용자에게는 "60초 뒤" 대신 "61초 뒤"로 안내되는 정도의 작은 버그였다.
- fail-open은 운영에서는 맞는 선택이지만(한도 때문에 사이트가 막히지 않게), 시험에서는 DB 오류를 "10번보다 많이 통과"로 위장할 수 있어 경고 로그를 함께 검사한다.

**안 한 것**
없음

## 결과

**동작 확인**
- 3개 동시 실행 × 6번(18회) 실패 0건
- DB 한도 시험 3개 통과

**리스크**
없음

**후속**
없음

**관련 문서**
[docs/API_DOCUMENTATION.md](../../API_DOCUMENTATION.md)
