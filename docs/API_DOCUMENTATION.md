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
| `POST /auth/login` | 로그인 | 501 (인증 벤더 미정) |
| `POST /auth/logout` | 로그아웃 | 501 |
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
| `POST /infer` | 입력은 이미 조립된 컨텍스트 + 유저 턴. 스트림 응답 | 501 (LLM 벤더 미정) |
| `POST /summarize` | 세션 종료 시. 관계/훅/지식 델타 반환 (형태는 아래 §13.4) | 501 |
| `POST /critique-test` | 공방 3턴 테스트: 붕괴/설명충/메타 여부 판정 | 501 |
| `POST /train` | 학습 시작 | **403 — v1 정책 차단** |
| `GET /train/{job_id}` | 학습 진행률 | **403 — v1 정책 차단** |

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
