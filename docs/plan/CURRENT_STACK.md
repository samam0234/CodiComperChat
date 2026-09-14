# 현재 스택 스냅샷

이 문서는 루트 `CodiComperChat_project_plan.md`(원본, §7·§9·§13)에서 파생된 개발용 요약이다. **원본과 모순되면 원본이 이긴다** — 이 문서를 먼저 고치고 원본을 나중에 맞추지 않는다.

## 확정 (계획서 §15 "합의")

| 영역 | 값 |
|------|-----|
| 프론트 | Next.js (React, TSX) — `apps/web/` |
| 도메인/상태 API | Nest.js (TypeScript) — `apps/api/` |
| AI 추론 | FastAPI (Python) — `services/ai/` |
| DB | PostgreSQL (1순위) |
| 세션 캐시·잡 | Redis |
| ORM | Prisma (Nest 쪽) |
| 저장소 형태 | 모노레포 (`apps/web`, `apps/api`, `services/ai`, `docker-compose.yml`) |

## 아직 열린 항목 (계획서 §15 "아직 열린 것")

- 정확한 세계관 장르
- 첫 공식 캐릭터 이름·설정 본문
- 인증 벤더
- 호스티드 LLM 벤더
- 과금 수치
- 영문 표기 `CodiComperChat` 유지 여부

## 포트 (제안값 — 미확정, 코드에서 임의로 다르게 정하지 말고 여기서 먼저 갱신)

| 서비스 | 제안 포트 | 확정 여부 |
|--------|-----------|-----------|
| Next.js (`apps/web`) | 3000 | 미정 |
| Nest.js (`apps/api`) | 4000 | 미정 |
| FastAPI (`services/ai`) | 8000 | 미정 |
| PostgreSQL | 5432 | 미정 |
| Redis | 6379 | 미정 |

## 역할 분리 원칙 (계획서 §7.1, 위반 금지)

- 프론트는 FastAPI를 직접 호출하지 않는다
- FastAPI는 내부망에서만 Nest가 호출한다
- 학습 API(`/train`)는 외부에 열지 않는다
- Next.js Route에 무거운 추론을 넣지 않는다

## API 경계 (계획서 §13.1, §13.2)

- Nest가 밖으로 여는 것: `/auth/*`, `/characters`, `/campaigns`, `/campaigns/:id/messages`, `/campaigns/:id/sessions*`, `/campaigns/:id/logbook`, `/studio/*`
- FastAPI가 안으로만 여는 것: `/infer`, `/summarize`, `/critique-test`, `/train` (v1은 막아 둠)

## 핵심 도메인 (계획서 §7.5, 테이블명 확정은 Prisma 단계)

`User` `Character` `LoreEntry` `Campaign` `CampaignState` `Session` `Message` `MemoryChunk`

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
