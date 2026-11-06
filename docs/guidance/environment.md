# 환경변수

각 앱이 읽는 환경변수 전체. 정본은 코드이고, 샘플은 `apps/api/.env.example`·`services/ai/.env.example`이다. 바뀌면 샘플 두 곳과 이 표를 함께 고친다. 최종 갱신 2026-10-25.

`.env`는 git에 올라가지 않는다(`.gitignore`). 비밀 값(DB 비밀번호, `AUTH_SECRET`, 토스 시크릿 키, SMTP 비밀번호)은 문서·대화·커밋·로그에 남기지 않는다.

<!-- logic-structure -->
## 로직 구조

```text
apps/api/.env ─────┬─ DATABASE_URL · AUTH_SECRET · AI_BASE_URL · AI_SERVICE_TOKEN · 메일 · 결제 · ADULT_MODE
services/ai/.env ──┼─ OLLAMA_* · AI_SERVICE_TOKEN(같은 값) · IMAGE_ENGINE · 프리미엄 키
apps/web ──────────┼─ API_BASE_URL · CONSOLE_BASE_URL
console ───────────┘─ API_BASE_URL · WEB_BASE_URL
운영 설정(월드 이벤트 등)은 환경변수가 아니라 DB app_settings (콘솔)
빈 값은 "설정 안 함"으로 읽는다 (repeater/empty-env-var.md)
```

<!-- logic-mermaid -->

### 환경변수가 닿는 곳

```mermaid
flowchart LR
  AE["apps/api/.env"] --> N["Nest"]
  SE["services/ai/.env"] --> A["FastAPI"]
  WE["web 환경"] --> W["Next web"]
  CE["console 환경"] --> C["Next console"]
  N -- "AI_SERVICE_TOKEN 같은 값" --- A
  DB[("app_settings")] --> N
```

## `apps/api/.env` (Nest)

| 키 | 필수 | 기본값 | 무엇 |
|----|------|--------|------|
| `DATABASE_URL` | **필수** | — | PostgreSQL 주소 |
| `AUTH_SECRET` | **필수** | — | 로그인 토큰 서명 키, 32자 이상(짧으면 시작하지 않음) |
| `PORT` | | 4000 | |
| `AI_BASE_URL` | | `http://localhost:8000` | FastAPI 주소 |
| `AI_SERVICE_TOKEN` | 운영 필수 | 비움 | FastAPI와 같은 내부 호출 토큰(32자 이상). 개발에서 비우면 FastAPI는 루프백만 받는다. `node scripts/generate-prod-secrets.mjs` |
| `REQUIRE_HTTPS` | 운영 필수 | 꺼짐 | `1`이면 공개 호스트의 http를 https로 보내고 https 응답에 HSTS를 붙인다. `NODE_ENV=production`인데 이 값이 없고 공개 호스트면 API가 시작되지 않거나 503 |
| `REQUIRE_HTTPS_EXEMPT_HOSTS` | 내부망 배포 | — | 쉼표로 구분한 내부 호스트 이름(운영 compose는 `api`). 이 호스트의 http는 https로 돌려보내지 않는다. 공개 도메인을 넣지 않는다 |
| `AI_CONCURRENCY` | | 2 | AI 동시 호출 수(**서버 한 대 기준**. 서버 N대면 모델이 받는 동시 호출은 N × 이 값) |
| `AI_TIMEOUT_MS` | | 280000 | 화면에서 기다리는 AI 답의 제한(ms). 웹 함수 상한(Vercel Hobby 300초)보다 짧게 둔다. `node:http`로 보내 Node fetch의 300초 벽이 없다 |
| `AI_BACKGROUND_TIMEOUT_MS` | | 600000 | 기억·요약 같은 배경 AI 작업의 제한(ms) |
| `AI_QUEUE_WAIT_MS` | | 60000 | 기다리는 답이 AI 대기열에서 기다리는 최대 시간(ms). 느린 서버면 늘린다 |
| `PERSONA_RAG` | | 켜짐 | `off`면 지식 JSON을 무시하고 카드 원문 전부를 넣는다(효과 비교용) |
| `PERSONA_DATA_DIR` | | `apps/api/data/personas` | 페르소나 지식 JSON 폴더 |
| `RATE_LIMIT` | | 켜짐 | `off`면 요청 한도를 끈다(개발 중 막힐 때만) |
| `RATE_LIMIT_SCALE` | | 1 | 한도에 곱하는 수 |
| `MODEL_ENHANCED_DAILY_LIMIT` | | 30 | 강화 무료 모델(gemma4:12b)의 하루 사용 횟수(한국 시각 자정에 초기화). e2e는 2로 줄여 쓴다 |
| `ADULT_MODE` | | 켜짐(개발) · `off`(운영 compose 기본) | `off`면 성인 그림 만들기·보기와 성인 확인을 모두 막는다. 이미 확인한 계정도 막히고, 켜면 다시 쓸 수 있다 |
| `PRO_CLICK` | | 켜짐(개발) · 꺼짐(`NODE_ENV=production` 기본) · `on`(운영 compose 기본) | `on`이면 `/pricing`에서 결제 없이 프로로 30일 바꾼다(정식 서비스 전 임시). 토스 결제가 켜지면 값과 상관없이 닫힌다. 프로는 출석 코레딧이 5배(1000→5000)라 `PREMIUM_PROVIDERS`와 함께 켜면 무료 코레딧으로 나가는 실제 지출도 그만큼 늘 수 있다 |
| `PREMIUM_PROVIDERS` | | — | 실제 호출을 열 프리미엄 공급자(`anthropic`, `xai`를 쉼표로). 비우면 프리미엄은 "준비 중". **실제 돈이 나간다.** 키는 `services/ai`의 `ANTHROPIC_API_KEY`, `XAI_API_KEY`(비밀값, 커밋 금지) |
| `PREMIUM_MONTHLY_CREDITS` | | 한도 없음(개발) · `0`(`NODE_ENV=production` 기본) | 서비스 전체가 한 달(한국 시각)에 프리미엄으로 쓸 코레딧. 넘으면 `SPEND_CAP`으로 잠긴다. 운영에서 값을 넣지 않으면 키가 있어도 열리지 않는다. 동시 요청이 겹치면 답 몇 번만큼 넘을 수 있어 공급자 콘솔의 월 한도도 함께 건다 |
| `MODEL_PREMIUM_FAKE` | | — | **e2e 전용.** `1`이면 프리미엄(Claude·Grok) 호출을 연동 없이 services/ai로 보낸다(가짜 LLM에서 코레딧 경로 시험용). 운영·개발에서 켜지 않는다 |
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
| `NODE_ENV` | | — | `production`이면: 가짜 결제·개발용 메일 로그가 꺼지고, `REQUIRE_HTTPS=1`·`AI_SERVICE_TOKEN`(32자 이상)이 있어야 시작된다. `LLM_FAKE`·`IMAGE_FAKE`·`MODEL_PREMIUM_FAKE`·`MAIL_OUTBOX_DIR`·`BILLING_PROVIDER=mock`이 있으면 시작하지 않는다 |

확인 도구: `npm run billing:check --workspace api`(토스 키·연결), `npm run mail:check --workspace api -- 받을주소`(SMTP). 둘 다 설정 값을 출력하지 않는다.

## `services/ai/.env` (FastAPI)

앱이 시작할 때 이 폴더의 `.env`를 스스로 읽는다.

| 키 | 기본값 | 무엇 |
|----|--------|------|
| `OLLAMA_BASE_URL` | `http://localhost:11434` | 로컬 Ollama |
| `OLLAMA_MODEL` | `gemma4:e4b` | 글·그림 모두 이 모델 |
| `OLLAMA_READ_TIMEOUT_SECONDS` | 600 | Ollama를 스트리밍으로 부르며 **토큰 사이 공백**에만 거는 제한(초). 모델이 계속 쓰는 동안은 끊지 않는다. 0이면 제한 없음 |
| `OLLAMA_CONNECT_TIMEOUT_SECONDS` | 10 | Ollama 연결 제한(초) |
| `OLLAMA_TOTAL_TIMEOUT_SECONDS` | 0(없음) | 답 하나 전체의 상한(초, 선택) |
| `OLLAMA_WARMUP` | 꺼짐 | `1`이면 기동 때 대화 모델을 미리 올린다(첫 답 지연 방지). 모델은 `OLLAMA_WARMUP_MODELS`(쉼표) 또는 `OLLAMA_MODEL` |
| `AI_SERVICE_TOKEN` | 비움 | Nest와 같은 값. 있으면 `X-AI-Token`이 맞는 요청만 받는다. 비우면 루프백만 |
| `APP_ENV` | 꺼짐 | `production`이면 토큰 32자 이상이 필요하고 `LLM_FAKE`·`IMAGE_FAKE`가 켜져 있으면 시작하지 않는다 |
| `LLM_FAKE` | 꺼짐 | **시험용.** `1`이면 모델 없이 고정된 가짜 답. e2e가 자동으로 켠다 (코디포토넷의 가짜 그림 엔진도 함께 켜진다) |
| `IMAGE_ENGINE` | `local` | 코디포토넷 그림 엔진. `local`: services/ai 안에서 diffusers로 직접 그린다(배포용, `requirements-image.txt` 필요) / `webui`: 따로 띄운 WebUI를 부른다. [photonet-engine.md](photonet-engine.md) |
| `SD_MODEL_DIR` | `services/ai/models/` | `local` 엔진이 체크포인트 파일을 찾는 폴더(아래 두 파일 이름 그대로) |
| `SD_OFFLOAD` | 꺼짐 | `local` 엔진에서 `1`이면 쓰는 부분만 그래픽 메모리에 올린다(그래픽 메모리가 8GB 이하일 때, 느려진다) |
| `SD_WEBUI_URL` | `http://127.0.0.1:7860` | `webui` 엔진일 때 Stable Diffusion WebUI 주소 |
| `SD_ANIME_MODEL` | `animagine-xl-4.0-opt.safetensors` | 애니메이션·웹툰 화풍 체크포인트 |
| `SD_BASE_MODEL` | `v1-5-pruned-emaonly.safetensors` | 수채화·실사풍 화풍 체크포인트 |
| `IMAGE_FAKE` | 꺼짐 | **시험용.** `1`이면 그림 엔진 없이 작은 그림을 만든다 |
| `FAKE_LLM_DELAY_MS` | 0 | 시험용. 가짜 답 지연(부하 측정) |
| `FAKE_LLM_SERIAL` | 꺼짐 | 시험용. `1`이면 한 번에 하나만 처리 |

## `apps/web` (Next.js)

`.env` 파일 없이 기본값으로 돈다. 바꿀 때만 실행 환경에 준다.

| 키 | 기본값 | 무엇 |
|----|--------|------|
| `API_BASE_URL` | `http://localhost:4000` | Nest 주소 (서버에서만 쓰인다) |
| `NEXT_DIST_DIR` | `.next` | 빌드 폴더. e2e는 `.next-e2e`로 개발 서버와 나눈다 |
| `NODE_ENV` | — | `production`이면 CSP에서 개발용 허용(eval·웹소켓)을 빼고 쿠키를 https 전용으로. 공개 호스트는 `REQUIRE_HTTPS=1`이 없으면 503 |
| `REQUIRE_HTTPS` | 꺼짐 | `1`이면 공개 호스트의 http를 https로 보내고 HSTS를 붙인다. 루프백은 그대로 |
| `CONSOLE_BASE_URL` | `http://localhost:3001` | 운영 콘솔 주소(마이페이지의 "운영 콘솔 열기", 예전 `/admin/*` 이동) |

## `console` (운영 콘솔, Next.js)

`.env` 파일 없이 기본값으로 돈다.

| 키 | 기본값 | 무엇 |
|----|--------|------|
| `API_BASE_URL` | `http://localhost:4000` | Nest 주소 (서버에서만 쓰인다) |
| `WEB_BASE_URL` | `http://localhost:3000` | 이용자 사이트 주소(캐릭터 이름을 누르면 실제 화면으로) |
| `NEXT_DIST_DIR` | `.next` | e2e는 `.next-e2e` |
| `NODE_ENV` | — | `production`이면 CSP 개발용 허용을 빼고 쿠키를 https 전용으로. 공개 호스트는 허용 목록이 없으면 403 (`CONSOLE_ALLOW_PUBLIC=1`로만 연다) |
| `REQUIRE_HTTPS` | 꺼짐 | 웹과 같다 |
| `CONSOLE_IP_ALLOWLIST` | 비움 | 쉼표로 구분한 이용자 IP. 운영의 공개 호스트에서 이 목록에 있을 때만 연다. 앞단이 `X-Forwarded-For`를 덮어써야 한다 |
| `CONSOLE_ALLOW_PUBLIC` | 꺼짐 | `1`이면 IP 제한을 끈다. 공개 전에 켜지 않는다 |

## 자동 테스트·CI가 쓰는 것

| 키 | 쓰는 곳 | 무엇 |
|----|---------|------|
| `E2E_DATABASE_URL` | `e2e/env.mjs` | e2e DB 주소. 없으면 `apps/api/.env`의 주소에서 DB 이름만 `codicomperchat_e2e`로 바꿔 쓴다 |
| `PYTHON` | `scripts/ci-local.mjs` | CI 재현에서 가상환경을 만들 파이썬(기본 `python`) |

e2e 서버(`e2e/servers/*.mjs`)는 위 값을 스스로 정한다: 가짜 LLM, 가짜 결제(토스 키 비움), 메일은 폴더로, 요청 한도 1000배 + DB 저장소, 전용 포트 3101/4101/8101.

관련: [getting-started.md](getting-started.md), [../plan/CURRENT_STACK.md](../plan/CURRENT_STACK.md)

## 월드코퍼챗 (2026-11-06)

새 환경변수는 없다. 이벤트 확률·간격·하루 보상 횟수는 DB `app_settings`에 두고 운영 콘솔 **월드코퍼챗 → 운영 설정**에서 바꾼다(없으면 3회·35%·6턴). 성인 수위는 기존 `ADULT_MODE`를 따른다(`off`면 월드도 전체 이용가). 그림 올리기 한도는 본문 파서 300kb 안의 290KB다.
