# 하드코딩 구간 표시 규칙

> 최종 갱신 2026-10-24. 코드가 생겼다. 아래 "지금 고정해 둔 값" 표가 실제로 손봐야 할 자리다. 코드에 마커를 붙이지는 않았고, 값마다 상수 이름과 위치로 찾는다.

## 표시 규약

| 마커 | 의미 |
|------|------|
| `[하드코딩 파트]` | 아직 채워야 하는 숙제 — 값/로직이 임시이거나 비어 있음 |
| `[이미 구현된 구간 · 바이브]` | 이미 동작하는 코드. 손대기 전에 왜 이렇게 되어 있는지부터 이해 |
| `# >>> 여기에 작성 <<<` | 커서를 둘 위치 (다음 작업자가 바로 찾도록) |

## 이 프로젝트에서 우선적으로 마킹해야 할 자리 (계획서 §11 리스크표 기준)

계획서 §11 "리스크와 가드"에서 가장 위험하다고 짚은 지점들이 곧 하드코딩이 실제 값으로 바뀌어야 하는 우선순위다:

1. **컨텍스트 조립기** (`apps/api` → FastAPI로 넘기는 슬라이스 조립, §7.6 3단계) — 토큰 예산을 임시 상수로 시작하기 쉬운 자리
2. **비밀 누설 서버 필터** (§7.8) — "해금 전 비밀 키워드가 답변에 나왔는지" 검사 로직
3. **공방 발행 가드** (`/critique-test`, §6.3) — 붕괴/설명충/메타 판정 임계값
4. **숨은 디렉터 체크 빈도** (§7.6) — "턴마다 짧은 체크"의 실제 트리거 조건

## 지금 고정해 둔 값 (조정 후보)

| 무엇 | 값 | 위치 | 언제 바꾸나 |
|------|-----|------|-------------|
| 프로 가격 | 4,900원 / 49,000원 | `apps/api/src/billing/products.ts` (env `BILLING_PRICE_PRO_30/365`로 덮어씀) | 출시 전 가격 확정 |
| 프로 배수 | 3배 (긴 글 칸만) | `apps/api/src/plan/plan.ts` `PRO_MULTIPLIER` | 요금 정책 |
| 대화에 넣는 최근 턴 | 30 | `apps/api/src/conversations/conversations.service.ts` `CONTEXT_TURNS` | 모델 컨텍스트가 바뀔 때 |
| 기억·이야기 정리 주기 | 메시지 6개(3번 오감)마다 | `memories.service.ts` `MEMORIZE_EVERY_MESSAGES`, `campaign-story.service.ts` `DIGEST_EVERY_MESSAGES` | 비용·품질 |
| 친밀도 한 번 변화 폭 | ±8 | `apps/api/src/campaign-state/story-logic.ts` `MAX_DELTA` | 관계 체감 |
| 개인사 다시 쓰기 | 최대 2번 | `apps/api/src/character-chat/grounding.ts` | |
| 지식 조각 | 상위 3개, 700자 | `apps/api/src/persona-rag/` | |
| 초상 검수 확신 기준 | 60 미만이면 운영자 검수 | `services/ai/app/services/image_moderation.py` `MIN_CONFIDENCE` | 검수 기록이 쌓이면 |
| 초상 크기 | 150KB | `apps/api/src/studio/portrait.ts` | 저장소를 옮길 때 |
| AI 동시 호출·대기 | 2, 60초, 130/150초, 배경 20개 | `apps/api/src/ai/ai-queue.ts`, `ai-client.ts` (`AI_CONCURRENCY`) | 서버·모델 구성 |
| 요청 한도 | 로그인 15분 10번 등 | `apps/api/src/security/rate-limit.ts` `RULES` | 운영 데이터 |
| 공방 판정 기준 | 강의식 길이·존댓말 비율 등 | `services/ai/app/services/critique.py` | 평가(`evals`)로 확인하며 |
| 프로필 캐릭터 수 | 10개 | `apps/api/src/personas/personas.service.ts` `PERSONA_LIMIT` | |
| 코레딧 값 | 출석 1,000(프로 5,000) · 오퍼레이션 30/20/20/10 · 코디포토넷 50 · 웹툰 컷 45 · 비밀 퀘스트 보상 100 · 강화 무료 초과 1번 10 | `apps/api/src/credits/credits.ts`, `quests/quest.ts` `QUEST_REWARD_CREDITS`, `models/models.ts` `ENHANCED_OVERAGE_CREDITS` | 요금 정책·원가 |
| 강화 무료 하루 무료 횟수 | 30 | `models/models.ts` `ENHANCED_DAILY_LIMIT_DEFAULT` (env `MODEL_ENHANCED_DAILY_LIMIT`) | |
| 성인 나이 | 만 19세 (한국 시각) | `apps/api/src/account/adult.ts` `ADULT_AGE` | 본인인증 도입 시 |
| 미성년자 낱말·나이 검사 | 넓게("고등학생 때"도 막음) | `services/ai/app/services/photonet.py` `MINOR_WORDS`·`MINOR_AGE` | 성인 장면이 지나치게 막히면 — 안전 쪽으로 기운 값이라 신중히 |
| 그림 검수 기준 | 성인: 어려 보임·강제·실존 인물·실사·혐오·자해 / 전체 이용가: 성적·노출·유혈·폭력 추가. 확신도는 보지 않는다 | `services/ai/app/services/photonet_moderation.py` `REFUSE` | 검수 기록이 쌓이면 |
| 퀘스트 판정 | 확신 85 이상 + 근거 인용 8자 이상이 실제 대사에 있어야 | `services/ai/app/services/summarization.py` `VERIFY_MIN_CONFIDENCE`·`EVIDENCE_MIN` | 판정이 너무 엄격/느슨할 때 |
| 퀘스트 열리는 친밀도 기본 | 30(공방 슬라이더) · 유지성 40 | `quests/quest.ts` `EMPTY_QUEST`, `prisma/seed.mjs` | |
| 웹툰 컷 수·한도 | 2~6컷, 콘티 10분 6번·컷 10분 14번 | `operations/webtoon.service.ts`, `security/rate-limit.ts` | GPU 처리량 |
| 그림 크기·단계 | 애니 1216×832 28스텝 / SD1.5 768×512 | `services/ai/app/services/image_engine.py` (`SDXL_ANIME`·`SD15`) | 모델·화질 |

## 검색 팁

```bash
grep -rn "하드코딩 파트" apps services
grep -rn "여기에 작성" apps services
```

관련: [LOGIC_STRUCTURE.md](LOGIC_STRUCTURE.md), [AI_MODEL_STRATEGY.md](AI_MODEL_STRATEGY.md)
