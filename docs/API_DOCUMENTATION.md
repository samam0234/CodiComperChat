# API 문서 (경계 초안)

> 상태: **라우트 뼈대만 존재.** `GET /health`를 제외한 모든 엔드포인트는 라우팅만 되어 있고 **501 Not Implemented**를 반환한다. 요청/응답 스키마는 Prisma 스키마와 DTO가 생기면 채운다. 상세 DB는 [plan/DATABASE.md](plan/DATABASE.md).

정본: `CodiComperChat_project_plan.md` §13.1, §13.2

## Base

| 앱 | Base URL | 상태 |
|----|----------|------|
| api (Nest.js) | `http://localhost:4000` | 기동 확인됨 (`npm run dev:api`) |
| ai (FastAPI, 내부 전용) | `http://localhost:8000` | 기동 확인됨. Nest만 호출, 웹은 직접 호출 금지. 대화형 문서 `/docs` |

## Nest.js — 웹이 치는 엔드포인트

| 메서드/경로 | 용도 | 현재 |
|-------------|------|------|
| `GET /health` | 헬스체크 | **200** `{ status, service, timestamp }` |
| `POST /auth/signup` | 이메일 회원가입 `{ email, password, displayName }` | **201** `{ token, user }` · 중복 이메일 409 · 형식 오류 400 |
| `POST /auth/login` | 로그인 `{ email, password }` | **200** `{ token, user }` · 실패 401 (이메일·비밀번호 중 무엇이 틀렸는지 구분하지 않음) |
| `POST /auth/logout` | 로그아웃 | **204** (토큰이 상태 없는 JWT라 서버가 지울 것이 없다. 쿠키 삭제는 웹이 한다) |
| `GET /auth/me` | 내 계정 | **200** `{ id, email, displayName, createdAt }` · 🔒 |
| `PATCH /auth/me` | 표시 이름 변경 `{ displayName }` | **200** · 🔒 |
| `POST /auth/me/password` | 비밀번호 변경 `{ currentPassword, newPassword }` | **204** · 현재 비밀번호 틀림 401 · 🔒 |

| `GET /me/personas` | 내 프로필 캐릭터(주인공) 목록 | **200** `[{ id, name, description, updatedAt }]` · 🔒 |
| `POST /me/personas` | 프로필 캐릭터 생성 `{ name(1~20자), description?(~300자) }` | **201** · 10개 초과 409 · 🔒 |
| `PATCH /me/personas/:id` | 수정 | **200** · 남의 것/없음 404 · 🔒 |
| `DELETE /me/personas/:id` | 삭제 | **204** · 남의 것/없음 404 · 🔒 |
| `GET /characters/:id/chat` | 이 캐릭터와 저장된 내 대화 | **200** `{ started, messages: [{ id, role, text, speaker, createdAt }] }` (최근 200개). 대화 전이면 `started: false`와 시작 장면 1개 · 🔒 |
| `POST /characters/:id/chat` | 캐릭터와 대화 `{ message(~2000자), personaId }` | **200** `{ reply }` · 🔒 · `personaId` 필수(없으면 400), 남의 프로필 404 · LLM 요청 한도 초과 429. **대화 기록은 서버에 저장된 것(최근 30턴)을 쓰고 요청의 `history`는 무시한다.** 답을 받은 뒤에만 유저 말·답을 함께 저장한다(실패한 턴은 남지 않음). 첫 메시지 때 대화(Campaign)를 만들고 시작 장면을 첫 메시지로 남긴다 |
| `GET /me/conversations` | 대화 목록(최근 대화 순) | **200** `[{ id, character, messageCount, updatedAt, lastMessage }]` · 🔒 |
| `POST /characters/:id/chat/suggestions` | 대답 추천 `{ personaId, avoid? }` (대화 기록은 서버 저장본) | **200** `{ suggestions: [3개] }` · 🔒 · `personaId` 필수 · `avoid`(최근 12개)에 넣은 추천과 겹치지 않게 새로 만든다("초기화") |
| `POST /agent-chat/messages` | 에이전트(코디컴퍼챗 안내 챗봇) `{ message(~2000자), history?(최근 20턴) }` | **200** `{ reply }` · 비로그인 가능 · LLM 요청 한도 초과 429 |

🔒 = `Authorization: Bearer <token>` 필요, 없거나 무효하면 401. 토큰은 HS256 JWT(7일, `AUTH_SECRET`로 서명)이고 비밀번호는 scrypt로 저장한다. 응답에 `passwordHash`는 절대 넣지 않는다. 웹은 토큰을 httpOnly 쿠키(`session`)에 넣고 서버에서만 Nest로 전달한다 — 브라우저 JS는 토큰을 볼 수 없다.
| `GET /characters` | 발행된 공식 캐릭터 목록 | 501 |
| `POST /campaigns` | 캠페인 시작 | 501 |
| `GET /campaigns/:id` | 상태 포함 캠페인 조회 | 501 |
| `POST /campaigns/:id/sessions` | 세션 열기 | 501 |
| `POST /campaigns/:id/messages` | 유저 메시지 전송 + 스트림 응답 | 501 (컨텍스트 조립 + FastAPI `/infer` 중계 자리) |
| `POST /campaigns/:id/sessions/:sessionId/close` | 세션 종료·요약 트리거 | 501 (`/summarize` 결과를 CampaignState에 머지하는 자리) |
| `GET /campaigns/:id/logbook` | 회차 목록 | 501 |
| `POST /studio/characters` | 캐릭터 초안 생성 | 501 |
| `PATCH /studio/characters/:id` | 캐릭터 초안 수정 | 501 |
| `POST /studio/characters/:id/test` | 3턴 테스트 | 501 (`/critique-test` 호출 자리) |
| `POST /studio/characters/:id/publish` | 발행 (필수 필드·붕괴 검사 통과 시) | 501 |

> 501을 쓰는 이유: 뼈대 단계에서 가짜 데이터를 돌려주면 프론트가 그걸 진짜로 착각한 채 배선된다. 미구현은 시끄럽게 실패하는 편이 낫다. 기획서 §10 4번의 "가짜 스트림"은 세션 채팅 셸을 만들 때 의도적으로 도입한다.

## FastAPI — Nest만 내부에서 호출 (웹은 알 필요 없음)

| 메서드/경로 | 용도 | 현재 |
|-------------|------|------|
| `GET /health` | 헬스체크 | **200** `{ status, service, timestamp }` |
| `POST /infer` | 입력은 이미 조립된 컨텍스트 + 유저 턴 | **200** `{ reply }` (로컬 Ollama, 스트림은 아직) |
| `POST /suggest-replies` | 컨텍스트 + `avoid` → 유저(주인공)가 다음에 할 말 3개. 매번 태도를 무작위로 섞는다 | **200** `{ suggestions }` · 계획서 §13.2 밖 신규 경로 |
| `POST /assist` | 에이전트 페이지 안내 챗봇. 코디컴퍼챗 사용법·대화 요령으로 범위를 좁힌 시스템 프롬프트 | **200** `{ reply }` · 계획서 §13.2 밖 신규 경로 |
| `POST /summarize` | 세션 종료 시. 관계/훅/지식 델타 반환 (형태는 아래 §13.4) | 501 |
| `POST /critique-test` | 공방 3턴 테스트: 붕괴/설명충/메타 여부 판정 | 501 |
| `POST /train` | 학습 시작 | **403 — v1 정책 차단** |
| `GET /train/{job_id}` | 학습 진행률 | **403 — v1 정책 차단** |

요청/응답 스키마는 `services/ai/app/schemas/`에 Pydantic 모델로 정의되어 있고, `http://localhost:8000/docs`에서 실제 형태를 볼 수 있다. 미구현이라도 **본문 검증은 작동한다** — 잘못된 본문은 501이 아니라 422와 함께 어느 필드가 틀렸는지 알려준다.

**필드명은 camelCase다.** 프론트 폼·Nest DTO·FastAPI 입력이 같은 뼈대를 공유해야 하고(기획서 §7.5) TypeScript 쪽이 camelCase이기 때문이다. 파이썬 내부는 snake_case를 쓰되 두 형태 모두 입력으로 받는다.

> `/train`의 403은 501과 의미가 다르다. 미구현이 아니라 **의도적으로 닫아 둔 것**이다 — v1은 자체 가중치 학습을 하지 않고 경로만 설계에 남긴다 (기획서 §7.6, §7.7). 구현하려다 만 것으로 오해하지 말 것.

## `/summarize` 반환 형태 (계획서 §13.4)

자유 산문 요약만 받지 않는다. 최소한 아래 필드를 구조화해서 돌려준다:

- `brief` — 다음 회차 브리핑용 3~5문장 (시스템용, 캐릭터 시점 아님)
- `relationDelta` — 어떤 관계 축이 왜 변했는지
- `hooksOpen` / `hooksClosed`
- `knowledgeGained` — 캐릭터가 새로 알게 된 것
- `unlocks` — 이번 세션에서 조건이 충족된 비밀 ID
- `nextPressure` — 디렉터가 다음 회차에 쓸 압력 한 줄

Nest는 이 객체를 `CampaignState`에 머지한다.

## 하지 말 것

- 웹(Next.js)에서 `/infer`, `/summarize` 등 FastAPI 엔드포인트를 직접 호출 (계획서 §7.1, §13 위반)
- `/train`을 v1에서 외부에 여는 것
