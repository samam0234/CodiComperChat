# 빈 환경변수가 "설정됨"으로 읽혀 기본값이 안 먹음

## 1. 환경

local / CI / 배포 도구. `.env`에 `KEY=`처럼 값 없이 적었거나, 스크립트·CI가 변수를 지우려고 빈 문자열을 넣었을 때

## 2. 증상

기본값이 있는 설정이 엉뚱하게 동작한다. 예: e2e에서 가입이 모두 429(요청 한도가 1000배가 아니라 1배)

## 3. 원인

`process.env.X ?? '기본값'`은 **`undefined`만** 기본값으로 바꾼다. 빈 문자열 `''`은 그대로 지나가 `Number('') = 0` 같은 값이 된다

## 4. 해결

- 기본값이 있는 설정은 `process.env.X || '기본값'` 또는 `value?.trim() ? … : 기본값`으로 읽는다 (예: `apps/api/src/billing/products.ts`의 `priceFrom`, `e2e/servers/api.mjs`)
- 숫자 설정은 읽은 뒤 범위를 검사하고 틀리면 기본값 (`concurrencyFromEnv`, `scale()`, `priceFrom`)
- 스크립트에서 변수를 "지우려면" 빈 값을 넣지 말고 환경에서 빼서 넘긴다 (`scripts/ci-local.mjs`)

## 5. 검증 명령

```bash
RATE_LIMIT_SCALE= npm run test:e2e -- auth   # 빈 값이어도 통과해야 한다
```

관련: [../find_debug/2026-10-16.md](../find_debug/2026-10-16.md), [../guidance/environment.md](../guidance/environment.md)
