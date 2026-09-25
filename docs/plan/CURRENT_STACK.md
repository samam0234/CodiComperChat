# 현재 스택 스냅샷

이 문서는 루트 `CodiComperChat_project_plan.md`(원본, §7·§9·§13)에서 파생된 개발용 요약이다. **원본과 모순되면 원본이 이긴다** — 이 문서를 먼저 고치고 원본을 나중에 맞추지 않는다.

## 확정 (계획서 §15 "합의")

| 영역 | 값 |
|------|-----|
| 프론트 | Next.js 16.3.5 (React 19.2.8, App Router, TSX) — `apps/web/` **구현 시작됨** |
| 도메인/상태 API | Nest.js 12 (TypeScript, ESM) — `apps/api/` **구현 시작됨** |
| AI 추론 | FastAPI (Python 3.12) — `services/ai/` **구현 시작됨** |
| DB | PostgreSQL (1순위) — 로컬 개발은 Docker가 아니라 **설치형 PostgreSQL 16** (`D:\PostgreSQL\16`, 데이터 `D:\PostgreSQL\16\data`, 2026-09-25 전환 · [docker-run.md](../guidance/docker-run.md)) |
| 세션 캐시·잡 | Redis |
| ORM | Prisma (Nest 쪽) — `apps/api/prisma/schema.prisma` **구현 시작됨** |
| 저장소 형태 | 모노레포 (`apps/web`, `apps/api`, `services/ai`, `docker-compose.yml` — 현재 `postgres`만 포함, web/api/ai 컨테이너화는 미완 · [docker-run.md](../guidance/docker-run.md)) |

## 아직 열린 항목 (계획서 §15 "아직 열린 것")

- 정확한 세계관 장르
- 첫 공식 캐릭터 이름·설정 본문 — 유지성, `docs/plan/CHARACTERS.md` 카드 원고를 Prisma seed(`apps/api/prisma/seed.mjs`)로 로컬 DB에 반영 완료(`GET /characters` 확인함, 2026-09-16). 세부 설정(비밀·갈등 씨앗 방향)은 사용자 확정 대기
- 인증 벤더 — 외부 벤더는 미정. 대신 **자체 이메일·비밀번호 로그인**을 구현했다 (2026-09-25 사용자 지시, 기획서 §7.8 "v1은 이메일 또는 소셜 하나면 충분"의 이메일 쪽). Nest `apps/api/src/auth`(scrypt + HS256 JWT, 키 `AUTH_SECRET`), 웹은 httpOnly `session` 쿠키. 소셜 로그인을 붙일 때를 위해 `users.passwordHash`는 nullable
- 호스티드 LLM 벤더 — **개발 중에는 Google Gemini Flash를 쓴다** (2026-09-25 사용자 지시). 제품 차원의 벤더 확정은 아직이라 `docs/plan/AI_MODEL_STRATEGY.md` 정책은 유지한다. `services/ai/app/services/inference.py`가 `google-genai` SDK로 `gemini-3.6-flash`(env `GEMINI_MODEL`로 변경)를 호출한다 — `GEMINI_API_KEY`가 없으면 503을 돌려주고 아무 벤더도 호출하지 않는다. 벤더가 최종 확정되면 여러 벤더를 선택 가능하게 리팩터링할지 판단한다
- 과금 수치
- 영문 표기 `CodiComperChat` 유지 여부

## 스캐폴딩 단계에서 확정된 것 (2026-09-15)

| 영역 | 값 | 비고 |
|------|-----|------|
| 모노레포 도구 | npm workspaces (`workspaces: ["apps/*"]`) | 루트 `package.json`. `services/ai`는 Python이라 워크스페이스 밖 |
| Node | v24 / npm 11에서 동작 확인 | 버전 고정(`engines`)은 아직 안 함 |
| 스타일링 | **CSS Modules** (Next.js 내장) | Tailwind 등 외부 CSS 프레임워크는 도입하지 않음 — 추가 의존성 없이 시작 |
| 폰트 | 시스템 폰트 스택 (Pretendard → Apple SD Gothic Neo → Malgun Gothic → …) | `next/font/google` 제거: 빌드 시 네트워크 의존 제거 |
| 전역 셸 | 헤더 / 우측 드로어 / 푸터 | [NAVIGATION_IA.md](NAVIGATION_IA.md) |
| api 모듈 시스템 | **ESM** (`"type": "module"`, `module: nodenext`) | 상대 import에 `.js` 확장자 필수 — Nest 12 기본값 |
| api 테스트 | **vitest** (unit + e2e 설정 분리) | Nest 12가 Jest 대신 vitest로 생성 |
| api 린트 | **oxlint** | Nest 12 기본값 (ESLint 아님) |
| api 배포 도구 | `@nestjs/mau` **제거함** | 미사용 devDependency이면서 취약점 5건(undici/tmp)의 유일한 출처였음. 배포는 Docker 계획 |
| ai Python | **3.12.10** | `py -3.12`로 생성한 `services/ai/.venv`. 3.10도 설치되어 있으나 사용하지 않음 |
| ai 의존성 | `services/ai/requirements.txt` (fastapi 0.141.1, uvicorn[standard] 0.53.0) | 실제 설치본을 고정. npm workspaces 밖이라 루트 `npm install`로 안 깔림 |
| ai 학습 API | `/train`은 **코드에서 403으로 차단** | 미구현이 아니라 v1 정책 (기획서 7.7장) |
| 통신 필드명 | **camelCase** (프론트·Nest·FastAPI 공통) | 기획서 7.5장의 "세 곳이 같은 뼈대를 공유" 요구. ai는 `WireModel`이 변환, 파이썬 내부는 snake_case |
| ai Repository 계층 | **두지 않음 (의도적)** | FastAPI는 DB를 직접 보지 않는다 (기획서 7.4장). DB 접근은 `apps/api`(Prisma)에만 |

## 포트

| 서비스 | 포트 | 확정 여부 |
|--------|-----------|-----------|
| Next.js (`apps/web`) | 3000 | **확정** (Next 기본값, `npm run dev:web`으로 기동 확인) |
| Nest.js (`apps/api`) | 4000 | **확정** (`PORT` env로 덮어쓰기 가능, `npm run dev:api`) |
| FastAPI (`services/ai`) | 8000 | **확정** (uvicorn `--port 8000`) |
| PostgreSQL | 5432 | **확정** (로컬 설치형 서비스 `postgresql-x64-16`, localhost 전용. `docker-compose.yml`의 `postgres`는 선택 사항) |
| Redis | 6379 | 미정 (아직 compose에 없음) |

## 역할 분리 원칙 (계획서 §7.1, 위반 금지)

- 프론트는 FastAPI를 직접 호출하지 않는다
- FastAPI는 내부망에서만 Nest가 호출한다
- 학습 API(`/train`)는 외부에 열지 않는다
- Next.js Route에 무거운 추론을 넣지 않는다

## API 경계 (계획서 §13.1, §13.2)

- Nest가 밖으로 여는 것: `/auth/*`, `/characters`, `/characters/:id`, `/campaigns`, `/campaigns/:id/messages`, `/campaigns/:id/sessions*`, `/campaigns/:id/logbook`, `/studio/*`
  - `/characters/:id`는 계획서 §13.1 목록에 없는 신규 경로다 (캐릭터 상세 화면용). 계획서 갱신 때 §0 원칙에 따라 반영 여부 확인 필요
  - 두 캐릭터 경로 모두 `secret`·`secretUnlockCondition`을 응답에서 제외한다 (§13.3)
  - `POST /agent-chat/messages` — 에이전트 페이지 챗봇용. 계획서 §13.1 목록 밖 신규 경로이고, 범용 AI 어시스턴트라 §9.2 v1 제외 목록(생산성 기능)과 경계가 붙는다. 사용자 지시로 추가했으며 계획서 반영 여부 확인 필요. FastAPI `/assist`로 Gemini에 연결됨(2026-09-25). 범용 비서가 되지 않도록 시스템 프롬프트에서 "코디컴퍼챗 사용법·대화 요령 안내"로 범위를 묶고 관계없는 요청(코딩·일정 등)은 거절하게 했다
  - `POST /characters/:id/chat/suggestions` — 대답 추천(3개, "초기화"로 새로 받기). 계획서 목록 밖 신규 경로, 사용자 지시
- FastAPI가 안으로만 여는 것: `/infer`, `/summarize`, `/critique-test`, `/train` (v1은 막아 둠), 그리고 계획서 §13.2 밖 신규 `/assist`(에이전트), `/suggest-replies`(대답 추천)

## 핵심 도메인 (계획서 §7.5, 테이블명 확정은 Prisma 단계)

`User` `Character` `LoreEntry` `Campaign` `CampaignState` `Session` `Message` `MemoryChunk`

`apps/api/prisma/schema.prisma`에 6개 반영됨(`users` `characters` `campaigns` `campaign_states` `sessions` `messages`, 계획서 §10 2번 범위). `LoreEntry`·`MemoryChunk`는 아직 스키마 밖 — 로어·장기기억 단계에서 추가.

DB 연결: Prisma 7부터 `schema.prisma`가 아니라 `apps/api/prisma.config.ts`(CLI용) + `PrismaService`의 `@prisma/adapter-pg` 드라이버 어댑터(런타임용)로 관리. 실행 방법은 [docker-run.md](../guidance/docker-run.md) 참고.

## v1 범위 밖 (계획서 §9.2, 에이전트가 임의로 구현 확장 금지)

유저 캐릭터 광장/카드 마켓, 자체 LLM 학습, 멀티플레이/파티 채팅, 음성 통화·만화 자동생성, 생산성 기능(일정/할일/검색), 복잡한 전투 룰북

## 문서 갱신 체크리스트

다음이 바뀌면 **이 파일을 가장 먼저** 갱신하고, 그 다음 관련 문서(`plan/*`, `Architecture/*`, `web_management/ports-inventory.md`)를 맞춘다:

- [ ] 포트가 확정되거나 바뀜
- [ ] 인증/LLM 벤더가 정해짐
- [ ] `apps/`, `services/` 실제 폴더가 생겨 저장소 구조가 확정됨
- [ ] Prisma 스키마로 도메인 테이블명이 확정됨
- [ ] API 경계(§13)에 엔드포인트가 추가/변경됨
- [ ] v1 범위(§9.2)가 팀 합의로 조정됨 — 계획서 원본도 §0 원칙에 따라 함께 갱신
