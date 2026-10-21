# 환경변수

각 앱이 읽는 환경변수 전체. 정본은 코드이고, 샘플은 `apps/api/.env.example`·`services/ai/.env.example`이다. 바뀌면 샘플 두 곳과 이 표를 함께 고친다. 최종 갱신 2026-10-16.

`.env`는 git에 올라가지 않는다(`.gitignore`). 비밀 값(DB 비밀번호, `AUTH_SECRET`, 토스 시크릿 키, SMTP 비밀번호)은 문서·대화·커밋·로그에 남기지 않는다.

## `apps/api/.env` (Nest)

| 키 | 필수 | 기본값 | 무엇 |
|----|------|--------|------|
| `DATABASE_URL` | **필수** | — | PostgreSQL 주소 |
| `AUTH_SECRET` | **필수** | — | 로그인 토큰 서명 키, 32자 이상(짧으면 시작하지 않음) |
| `PORT` | | 4000 | |
| `AI_BASE_URL` | | `http://localhost:8000` | FastAPI 주소 |
| `AI_CONCURRENCY` | | 2 | AI 동시 호출 수(**서버 한 대 기준**. 서버 N대면 모델이 받는 동시 호출은 N × 이 값) |
| `PERSONA_RAG` | | 켜짐 | `off`면 지식 JSON을 무시하고 카드 원문 전부를 넣는다(효과 비교용) |
| `PERSONA_DATA_DIR` | | `apps/api/data/personas` | 페르소나 지식 JSON 폴더 |
| `RATE_LIMIT` | | 켜짐 | `off`면 요청 한도를 끈다(개발 중 막힐 때만) |
| `RATE_LIMIT_SCALE` | | 1 | 한도에 곱하는 수 |
| `MODEL_ENHANCED_DAILY_LIMIT` | | 30 | 강화 무료 모델(gemma4:12b)의 하루 사용 횟수(한국 시각 자정에 초기화). e2e는 2로 줄여 쓴다 |
| `RATE_LIMIT_STORE` | | `memory` | `db`면 PostgreSQL(`rate_limit_buckets`)에 함께 센다 — API 서버가 여러 대일 때 |
| `MAIL_SMTP_URL` | 운영 필수 | — | 개발: `smtp://127.0.0.1:1025`(Mailpit, `localhost`는 IPv6로 풀려 거절됨). 운영 예: `smtps://user:password@smtp.example.com:465` (비밀번호 특수문자는 URL 인코딩). 없으면 개발 중 로그에 메일 내용, 운영에서는 보내지 않음(오류 로그) |
| `MAIL_FROM` | | `코디컴퍼챗 <no-reply@codicomperchat.local>` | 보내는 사람 |
| `WEB_BASE_URL` | 운영 필수 | `http://localhost:3000` | 메일 속 링크가 가리킬 웹 주소 |
| `MAIL_OUTBOX_DIR` | | — | 보내지 않고 이 폴더에 JSON으로 남김(e2e가 씀) |
| `BILLING_PROVIDER` | | 자동 | `toss` / `mock`. 비우면 토스 키가 둘 다 있으면 토스, 개발 중이면 가짜 결제, 운영이면 결제를 열지 않음 |
| `TOSS_SECRET_KEY` | 결제 시 | — | 토스 시크릿 키(서버 승인·취소용). 절대 웹에 보내지 않음 |
| `TOSS_CLIENT_KEY` | 결제 시 | — | 토스 클라이언트 키(웹 결제창용, 공개돼도 되는 키) |
| `BILLING_PRICE_PRO_30` | | 4900 | 프로 30일 가격(원, 100~10,000,000 정수. 잘못 적으면 기본값) |
| `BILLING_PRICE_PRO_365` | | 49000 | 프로 1년 가격 |
| `NODE_ENV` | | — | `production`이면: 가짜 결제·개발용 메일 로그가 꺼진다 |

확인 도구: `npm run billing:check --workspace api`(토스 키·연결), `npm run mail:check --workspace api -- 받을주소`(SMTP). 둘 다 설정 값을 출력하지 않는다.

## `services/ai/.env` (FastAPI)

앱이 시작할 때 이 폴더의 `.env`를 스스로 읽는다.

| 키 | 기본값 | 무엇 |
|----|--------|------|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | 로컬 Ollama |
| `OLLAMA_MODEL` | `gemma4:e4b` | 글·그림 모두 이 모델 |
| `LLM_FAKE` | 꺼짐 | **시험용.** `1`이면 모델 없이 고정된 가짜 답. e2e가 자동으로 켠다 |
| `FAKE_LLM_DELAY_MS` | 0 | 시험용. 가짜 답 지연(부하 측정) |
| `FAKE_LLM_SERIAL` | 꺼짐 | 시험용. `1`이면 한 번에 하나만 처리 |

## `apps/web` (Next.js)

`.env` 파일 없이 기본값으로 돈다. 바꿀 때만 실행 환경에 준다.

| 키 | 기본값 | 무엇 |
|----|--------|------|
| `API_BASE_URL` | `http://localhost:4000` | Nest 주소 (서버에서만 쓰인다) |
| `NEXT_DIST_DIR` | `.next` | 빌드 폴더. e2e는 `.next-e2e`로 개발 서버와 나눈다 |
| `NODE_ENV` | — | `production`이면 CSP에서 개발용 허용(eval·웹소켓)을 빼고 쿠키를 https 전용으로 |

| `CONSOLE_BASE_URL` | `http://localhost:3001` | 운영 콘솔 주소(마이페이지의 "운영 콘솔 열기", 예전 `/admin/*` 이동) |

## `console` (운영 콘솔, Next.js)

`.env` 파일 없이 기본값으로 돈다.

| 키 | 기본값 | 무엇 |
|----|--------|------|
| `API_BASE_URL` | `http://localhost:4000` | Nest 주소 (서버에서만 쓰인다) |
| `WEB_BASE_URL` | `http://localhost:3000` | 이용자 사이트 주소(캐릭터 이름을 누르면 실제 화면으로) |
| `NEXT_DIST_DIR` | `.next` | e2e는 `.next-e2e` |
| `NODE_ENV` | — | `production`이면 CSP 개발용 허용을 빼고 쿠키를 https 전용으로 |

## 자동 테스트·CI가 쓰는 것

| 키 | 쓰는 곳 | 무엇 |
|----|---------|------|
| `E2E_DATABASE_URL` | `e2e/env.mjs` | e2e DB 주소. 없으면 `apps/api/.env`의 주소에서 DB 이름만 `codicomperchat_e2e`로 바꿔 쓴다 |
| `PYTHON` | `scripts/ci-local.mjs` | CI 재현에서 가상환경을 만들 파이썬(기본 `python`) |

e2e 서버(`e2e/servers/*.mjs`)는 위 값을 스스로 정한다: 가짜 LLM, 가짜 결제(토스 키 비움), 메일은 폴더로, 요청 한도 1000배 + DB 저장소, 전용 포트 3101/4101/8101.

관련: [getting-started.md](getting-started.md), [../plan/CURRENT_STACK.md](../plan/CURRENT_STACK.md)
