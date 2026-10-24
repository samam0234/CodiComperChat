# 현재 스택 스냅샷

이 문서는 루트 `CodiComperChat_project_plan.md`(원본, §7·§9·§13)에서 파생된 개발용 요약이다. **원본과 모순되면 원본이 이긴다** — 이 문서를 먼저 고치고 원본을 나중에 맞추지 않는다.

> 최종 갱신 2026-10-24. 앱이 서로 연결되어 실제로 동작한다(가입 → 캐릭터 대화 → 기억·이야기 정리, 공방 제작·발행, 신고·검수, 코레딧·오퍼레이션·코디포토넷·웹툰·비밀 퀘스트, 결제는 보류). 남은 큰 일은 **배포**(사용자 지시로 마지막에 한다)와 법률·보안 점검이다 — 공개 전 필수: [../../SECURITY.md](../../SECURITY.md), 모델·소프트웨어 라이선스: [../../THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md), 저장소 라이선스: [../../LICENSE](../../LICENSE)(독점).

## 확정 (계획서 §15 "합의")

| 영역 | 값 |
|------|-----|
| 프론트 | Next.js 16.3.5 (React 19.2.8, App Router, TSX) — `apps/web/` (이용자 사이트), `console/` (운영 콘솔, 2026-10-21 분리) |
| 도메인/상태 API | Nest.js 12 (TypeScript, ESM) — `apps/api/` |
| AI 추론 | FastAPI (Python 3.12) — `services/ai/`. 로컬 Ollama(`gemma4:e4b`)를 부른다 |
| DB | PostgreSQL 16 — 로컬 개발은 Docker가 아니라 **설치형** (`D:\PostgreSQL\16`, 2026-09-25 전환 · [docker-run.md](../guidance/docker-run.md)) |
| ORM | Prisma 7 (Nest 쪽) — `apps/api/prisma/schema.prisma`, 테이블 27개·마이그레이션 31개 · [DATABASE.md](DATABASE.md) |
| 세션 캐시·잡 | Redis — **아직 쓰지 않는다.** 요청 한도는 메모리/PostgreSQL, AI 호출 대기열은 프로세스 메모리로 해결했다(아래) |
| 저장소 형태 | 모노레포 (`apps/web`, `apps/api`, `console/`, `services/ai`, `e2e/`, `docker-compose.yml` — compose는 `postgres`·`mailpit`) |

## 구현하면서 정한 것

| 영역 | 값 | 근거·위치 |
|------|-----|-----------|
| 인증 | **자체 이메일·비밀번호** (scrypt + HS256 JWT 7일, `AUTH_SECRET`). 웹은 httpOnly `session` 쿠키 | 기획서 §7.8 "v1은 이메일 또는 소셜 하나면 충분"의 이메일 쪽. `apps/api/src/auth` |
| 이메일 인증·비밀번호 찾기 | 메일 링크 일회용 토큰(DB에는 해시만). 캐릭터 **발행은 인증한 계정만** | `auth/email-token.ts`, `mail/` |
| 로그인 토큰 무효화 | 토큰에 계정의 세대(`sessionVersion`)를 싣고, 비밀번호 변경·재설정 때 올려 이전 토큰을 모두 끊는다 | `auth/session.ts` |
| 메일 발송 | SMTP(`MAIL_SMTP_URL`) / 폴더(`MAIL_OUTBOX_DIR`, 시험용) / 개발 중 로그. **개발 메일 서버는 Mailpit**(docker compose, SMTP 1025·웹 8025). 운영 메일 서비스는 미정 | `mail/mail.service.ts`, 확인 `npm run mail:check --workspace api` |
| 회원 탈퇴 | 계정·데이터 삭제, 발행 캐릭터는 먼저 내림, 결제 기록은 법정 보관(계정 연결만 끊음) | `account/` |
| LLM | **개발 중에는 로컬 Ollama `gemma4:e4b`** (2026-09-26, Gemini에서 교체). 그림 인식(검수)도 같은 모델. 모델 사용 정책 확인 필요(성인 모드) — [THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md) |
| 그림 엔진 (2026-10-24) | **services/ai 안에서 diffusers로 직접 그린다**(`IMAGE_ENGINE=local`, 기본, 선택 설치 `requirements-image.txt`: PyTorch 2.10 CUDA 12.8 · diffusers 0.42). 애니메이션·웹툰 = Animagine XL 4.0, 수채화·실사풍 = SD 1.5, 체크포인트는 `services/ai/models/`(git 제외). 개발 PC 대안으로 기존 Stable Diffusion WebUI(`IMAGE_ENGINE=webui`). GPU 없으면 그림 기능만 "준비 중" | `services/ai/app/services/image_local.py`, `image_engine.py`, [../guidance/photonet-engine.md](../guidance/photonet-engine.md) |
| 코레딧·모델 (2026-10-21~24) | 출석 1,000(프로 5,000), 100 코레딧 = 350원. 강화 무료 `gemma4:12b` = 무료 하루 30번 → 그 뒤 자정까지 1번 10 코레딧, 프로 무제한. 프리미엄(Claude·Grok)은 코레딧(연동 전이라 "준비 중") | `credits/`, `models/`, [AI_MODEL_STRATEGY.md](AI_MODEL_STRATEGY.md) |
| 오퍼레이션 (2026-10-23~24) | 심리 탐구 30 · 일기 20 · 메시지(무료) · 커뮤니티 20/10 · 코디포토넷 50 · **웹툰 한 컷 45(콘티 무료)** | `operations/`, [OPERATIONS.md](OPERATIONS.md) |
| 성인 모드 (2026-10-24) | 코디포토넷·웹툰의 전체 이용가/성인 분리. 성인 확인 = **생년월일 + 동의 + 이메일 인증(자기 신고, 본인인증 없음 — 사용자 결정)**, 거짓 입력의 법적 책임은 이용자(약관·동의 문구). 미성년자 설정 원천 차단·실사 금지·그림 검수 | `account/adult.ts`, [OPERATIONS.md](OPERATIONS.md) "수위" |
| 비밀 퀘스트 (2026-10-24) | 캐릭터가 건네는 숨은 미션. 직접·AI 제작, 엄격 판정(인용 근거 대조). 공식 캐릭터만 100 코레딧(계정×캐릭터당 한 번) | `quests/`, [SECRET_QUEST.md](SECRET_QUEST.md) | `services/ai/app/services/llm.py`, [AI_MODEL_STRATEGY.md](AI_MODEL_STRATEGY.md) |
| AI 호출 대기열 | 동시 호출 `AI_CONCURRENCY`(기본 2, **서버 한 대 기준**), 기다리는 답 우선·배경 작업(기억·요약)은 양보, 대기 60초 넘으면 503, 응답 130초(배경 150초) 넘으면 504 | `apps/api/src/ai/ai-queue.ts` |
| 요청 한도 | 고정 창. 기본은 서버 메모리, 서버가 여러 대면 `RATE_LIMIT_STORE=db`(PostgreSQL `rate_limit_buckets`) | `security/rate-limit.ts`, `security/rate-store.ts` |
| 요금 등급 | FREE / PRO. PRO는 공방 긴 글 칸 글자 수 3배(매 턴 들어가는 짧은 칸은 그대로) | `plan/plan.ts`, `studio/card.ts` |
| 운영 콘솔 | 별도 Next.js 앱(`console/`). 운영자만 로그인(`console_session`), 대시보드·신고·초상 검수·캐릭터·계정 등급. 이용자 사이트의 `/admin/*`는 콘솔로 보낸다 | [../guidance/operations.md](../guidance/operations.md) |
| 결제 (**보류**, 2026-10-21 사용자 결정) | **토스페이먼츠**(SDK v2 결제창 + 승인·취소 API). 키가 없으면 개발 중 가짜 결제(mock), 운영에서는 결제를 열지 않음. 정기 결제 없음 | `billing/`, 확인 `npm run billing:check --workspace api` |
| 가격 | 프로 30일 4,900원 · 1년 49,000원 — **출시 전 임시값**, `BILLING_PRICE_PRO_30/365`로 바꾼다 | `billing/products.ts` |
| 초상 이미지 | 공방에서 올림(webp·jpeg·png, 150KB). **자동 검수**(로컬 모델) → 통과·운영자 검수·거절. 승인된 것만 남에게 보임 | `studio/portrait-review.service.ts`, FastAPI `/moderate-image` |
| 페르소나 지식 RAG | 캐릭터별 비공개 JSON(`apps/api/data/personas`, git 제외) → 글자 2-gram BM25로 관련 조각만 | `persona-rag/`, [../Architecture/data-flow.md](../Architecture/data-flow.md) |
| 보안 헤더·CSP | 요청마다 nonce를 쓰는 엄격한 CSP(`apps/web/proxy.ts`), 위반은 `/api/csp-report`로 받아 로그 | [../API_DOCUMENTATION.md](../API_DOCUMENTATION.md) "보안 헤더" |
| 화면 디자인 | "밤하늘 아래 이어지는 이야기" — 보라·분홍 그라데이션, 라이트·다크 두 벌 | [DESIGN.md](DESIGN.md) |
| 테스트 | API vitest 185개(단위·통합, 실제 PostgreSQL·SMTP 포함), 웹 Playwright e2e 105개(가짜 LLM·가짜 결제·가짜 그림 엔진), AI 품질 평가(`services/ai/evals`, 실제 모델) | [TESTING.md](TESTING.md) |
| CI | GitHub Actions(`.github/workflows/ci.yml`), 내 PC에서 같은 단계 재현 `npm run ci:local` | [TESTING.md](TESTING.md) "CI" |

## 아직 열린 항목 (계획서 §15 "아직 열린 것")

- 정확한 세계관 장르
- 첫 공식 캐릭터 이름·설정 본문 — 유지성, [CHARACTERS.md](CHARACTERS.md) 원고를 Prisma seed로 반영(비밀 퀘스트 「접어 둔 문제집」 포함). 세부 설정(비밀·갈등 씨앗 방향)은 사용자 확정 대기
- 호스티드 LLM 벤더 — 제품 차원의 벤더는 미정(개발은 로컬 Ollama). 정해지면 [AI_MODEL_STRATEGY.md](AI_MODEL_STRATEGY.md)와 함께 갱신
- 과금 수치 — 구조는 만들었고 **금액 확정만 남음**(위 "가격")
- 영문 표기 `CodiComperChat` 유지 여부
- 배포 대상(플랫폼·리전, **GPU 서버**), 운영 메일 서비스, 토스 상점 계약(결제 보류), 약관 법률 검토
- **성인 모드 공개 여부** — 모델 사용 정책(Gemma 사용 금지 정책 등) 확인, 성인 확인 방식(본인인증 도입 여부)의 법률 검토, 성인 콘텐츠 운영 체계(신고·검토·접근 차단)
- 저장소 라이선스의 권리자 법적 이름 확정(`LICENSE`)

## 스캐폴딩 단계에서 확정된 것 (2026-09-15)

| 영역 | 값 | 비고 |
|------|-----|------|
| 모노레포 도구 | npm workspaces (`workspaces: ["apps/*"]`) | 루트 `package.json`. `services/ai`는 Python이라 워크스페이스 밖 |
| Node | v24 / npm 11 | CI도 24. `engines` 고정은 아직 안 함 |
| 스타일링 | **CSS Modules** (Next.js 내장) | 외부 CSS 프레임워크 없음. 토큰은 `app/globals.css` |
| 폰트 | 시스템 폰트 스택 (Pretendard → Apple SD Gothic Neo → Malgun Gothic → …) | 외부 글꼴을 받지 않는다(CSP `font-src 'self'`, 빌드가 네트워크에 기대지 않게) |
| 전역 셸 | 헤더 / 우측 드로어 / 푸터 | [NAVIGATION_IA.md](NAVIGATION_IA.md) |
| api 모듈 시스템 | **ESM** (`"type": "module"`, `module: nodenext`) | 상대 import에 `.js` 확장자 필수 |
| api 테스트 | **vitest** | |
| api 린트 | **oxlint** (CI는 `--deny-warnings`) | |
| ai Python | **3.12** | `services/ai/.venv` |
| ai 의존성 | `services/ai/requirements.txt` (fastapi, uvicorn[standard], httpx) | 루트 `npm install`로 안 깔림 |
| ai 학습 API | `/train`은 **코드에서 403으로 차단** | v1 정책 (기획서 7.7장) |
| 통신 필드명 | **camelCase** (프론트·Nest·FastAPI 공통) | ai는 `WireModel`이 변환 |
| ai Repository 계층 | **두지 않음 (의도적)** | FastAPI는 DB를 직접 보지 않는다 (기획서 7.4장) |

## 포트

| 서비스 | 개발 | e2e(자동 테스트) | 비고 |
|--------|------|------------------|------|
| Next.js (`apps/web`) | 3000 | 3101 | e2e는 별도 빌드 폴더 `.next-e2e` |
| Next.js (`console`, 운영 콘솔) | 3001 | 3102 | `npm run dev:console`. 바깥에 열 때는 따로 막는다 |
| Nest.js (`apps/api`) | 4000 | 4101 | `PORT` env로 변경 |
| FastAPI (`services/ai`) | 8000 | 8101 | 내부 전용. e2e는 가짜 LLM(`LLM_FAKE=1`) |
| PostgreSQL | 5432 | 5432 (DB `codicomperchat_e2e`) | `npm run ci:local`은 `codicomperchat_ci`·`codicomperchat_ci_e2e` |
| Ollama | 11434 | 쓰지 않음 | |
| Stable Diffusion WebUI (선택) | 7860 (127.0.0.1) | 쓰지 않음(가짜 그림 엔진) | `IMAGE_ENGINE=webui`일 때만. `--server-name 127.0.0.1` 필수 |
| Mailpit (개발 메일) | 1025 SMTP · 8025 웹 | 쓰지 않음(메일은 폴더로) | `docker compose up -d mailpit`, 127.0.0.1에만 열림 |
| Redis | — | — | 쓰지 않음 |

e2e·CI 재현은 개발 서버·개발 DB와 겹치지 않아 같이 켜 둬도 된다.

## 역할 분리 원칙 (계획서 §7.1, 위반 금지)

- 프론트는 FastAPI를 직접 호출하지 않는다 (웹 → Nest → FastAPI)
- FastAPI는 내부망에서만 Nest가 호출한다
- 학습 API(`/train`)는 외부에 열지 않는다
- Next.js Route에 무거운 추론을 넣지 않는다 (웹의 `app/api/*`는 초상 그림 중계와 CSP 보고 받기뿐)

## API 경계 (계획서 §13.1, §13.2)

전체 목록과 응답은 [../API_DOCUMENTATION.md](../API_DOCUMENTATION.md). 계획서 목록과의 차이:

- **계획서의 `/campaigns/*` 경로는 라우트만 있고 501이다.** 실제 대화는 캐릭터 기준 경로 `/characters/:id/chat*`(대화·새로하기·이어하기·대답 추천·기억·상태설정·지난 이야기·엑스트라)로 만들었다 — 유저마다 캐릭터당 "지금 대화"가 하나이고 저장한 대화를 이어하는 구조라서. 계획서 반영 여부는 §0 원칙에 따라 확인 필요
- 계획서 목록 밖 신규 경로(모두 사용자 지시): `/characters/:id`(상세), `/characters/:id/portrait`, `/characters/:id/report`, `/me/personas`, `/me/extras`, `/me/conversations`, `/agent-chat/messages`(사용 안내 챗봇, 범용 비서가 되지 않게 범위를 묶음), `/billing/*`, `/admin/*`(신고·초상 검수·계정 등급·환불), `/auth/*` 확장(인증 메일·비밀번호 찾기·탈퇴)
- 캐릭터 응답은 `secret`·`secretUnlockCondition`을 늘 뺀다 (§13.3). 비밀은 AI에도 보내지 않는다
- FastAPI가 안으로만 여는 것: `/infer`, `/summarize`, `/critique-test`, `/train`(403), 그리고 §13.2 밖 신규 `/assist`(에이전트), `/suggest-replies`(대답 추천), `/remember`(기억 정리), `/ground-check`(개인사 환각 검사), `/draft-field`·`/draft-quest`(공방 AI 초안·퀘스트 제작), `/moderate-image`(초상 검수), `/mind` `/diary` `/board-posts` `/board-comments`(오퍼레이션), `/photonet`·`/photonet/status`(코디포토넷), `/webtoon/plan`·`/webtoon/panel`(웹툰)

## 핵심 도메인 (계획서 §7.5)

계획서의 8개(`User` `Character` `LoreEntry` `Campaign` `CampaignState` `Session` `Message` `MemoryChunk`) 중 `LoreEntry`를 뺀 7개가 테이블로 있다 — 로어는 공방 카드(JSON)와 페르소나 지식 파일로 대신한다. 그 밖에 구현하며 생긴 테이블 20개(전체 27개). 전체는 [DATABASE.md](DATABASE.md).

DB 연결: Prisma 7부터 `apps/api/prisma.config.ts`(CLI용) + `PrismaService`의 `@prisma/adapter-pg`(런타임용). 실행 방법은 [docker-run.md](../guidance/docker-run.md).

## v1 범위 밖 (계획서 §9.2, 에이전트가 임의로 구현 확장 금지)

유저 캐릭터 광장/카드 마켓, 자체 LLM 학습, 멀티플레이/파티 채팅, 음성 통화·만화 자동생성, 생산성 기능(일정/할일/검색), 복잡한 전투 룰북

> 참고: 공방은 기획서 v1에서 "운영자용"이었으나 사용자 지시로 일반 유저도 만들고 공개·링크 공개·비공개로 발행할 수 있게 했다(목록은 공개만). 카드 "마켓"(거래·랭킹)은 만들지 않았다. 계획서 반영 여부 확인 필요.

## 문서 갱신 체크리스트

다음이 바뀌면 **이 파일을 가장 먼저** 갱신하고, 그 다음 관련 문서(`plan/*`, `Architecture/*`, `web_management/ports-inventory.md`, `guidance/environment.md`)를 맞춘다:

- [ ] 포트가 확정되거나 바뀜
- [ ] 인증/LLM/결제/메일 벤더가 정해짐
- [ ] 저장소 구조(앱·폴더)가 바뀜
- [ ] Prisma 스키마에 테이블이 추가·변경됨
- [ ] API 경계(§13)에 엔드포인트가 추가/변경됨
- [ ] 환경변수가 추가·변경됨 (`.env.example` 두 곳과 [../guidance/environment.md](../guidance/environment.md))
- [ ] 의존성·모델이 추가·교체됨 ([../../THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md)) — 보안 장치가 바뀜 ([../../SECURITY.md](../../SECURITY.md))
- [ ] v1 범위(§9.2)가 팀 합의로 조정됨 — 계획서 원본도 §0 원칙에 따라 함께 갱신
