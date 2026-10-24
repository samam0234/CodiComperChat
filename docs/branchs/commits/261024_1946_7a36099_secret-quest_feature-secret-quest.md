# 비밀 퀘스트 — 캐릭터가 건네는 숨은 미션, 직접 또는 AI로 제작

| 항목 | 내용 |
|------|------|
| Subject | `feat(quest): 비밀 퀘스트 — 캐릭터가 건네는 숨은 미션, 직접 또는 AI로 제작` |
| Full SHA | `7a360994ba0fa5af2d3ccec1a1ab209c43eeeeef` |
| Short SHA | `7a36099` |
| Branch | `feature/secret-quest` |
| Parent | `f1d40b6` (feature/photonet-rating) |
| Date | 2026-10-24T19:46:34+09:00 |

## 주 내용

- 카드에 선택 단계 "비밀 퀘스트"(이름·부탁·달성 조건·보상 장면·열리는 친밀도). 쓰기 시작하면 이름·부탁·달성 조건이 쌍이어야 하고, 덜 쓴 퀘스트는 발행해도 붙지 않음. 퀘스트는 카드 지문에서 제외(3턴 테스트 유효 여부에 영향 없음)
- 진행: 친밀도가 문턱을 넘으면 캐릭터 지시에 부탁이 붙고, 이야기 정리(/summarize)가 건넴·달성을 판정. 달성 조건은 캐릭터에게 알리지 않고 판정에만 사용. 건네기 전 화면에는 ???만
- 보상: 공식 캐릭터는 달성 시 100 코레딧(계정×캐릭터당 한 번, quest_rewards 기본키), 유저 제작 캐릭터는 보상 장면만(코레딧 파밍 방지)
- 공방: 직접 쓰기 / 칸별 AI 초안 / AI로 퀘스트 한 번에 만들기(POST draft-quest, 제안만 하고 적용을 눌러야 들어감, 비밀·해금 조건은 AI에 보내지 않음)
- 대화 화면: 코디포토넷 옆 "비밀 퀘스트" 열림 상자(퀘스트 있는 캐릭터에만, 상태가 바뀌면 점)
- 유지성 「접어 둔 문제집」(친밀도 40) — 시드와 개발 DB에 반영

## 상세

**배경**
사용자 요청("비밀 퀘스트 — 일단 유지성이라는 캐릭터에게 정하고, 캐릭터 제작할 때는 본인이 직접 만들어도 되고 ai로 자동 제작해도 되도록"). 설계가 없어 질문으로 정함: 캐릭터가 건네는 숨은 미션, 제작 대상은 퀘스트 내용.

**변경 범위**
apps/api(quests 모듈, card, draft-fields, publish, campaign-story, character-chat, credits, prisma), services/ai(summarize 판정, draft-quest, fake), apps/web(secret-quest 상자, 공방 퀘스트 단계, actions), e2e, docs/plan/SECRET_QUEST.md

**기술 포인트**
- 마이그레이션 20261024150000_secret_quest: characters.quest, campaign_states.questState, quest_rewards, CreditReason QUEST — 개발 DB에 적용, 시드로 유지성 퀘스트 반영(update: {}라 updateMany로 맞춤)
- 캐릭터 지시에는 달성 조건을 절대 넣지 않음(단위 시험으로 고정). 달성 직후 첫 답에서만 보상 장면(staged 표시)
- 판정 가드: 정리 전 친밀도가 문턱 아래면 무시, 건넨 적 없이는 달성 불가, 이미 달성했으면 재판정 없음. 비공개 구조는 Character.quest를 공개 select에서 제외
- e2e 가짜 LLM은 대사 표시로 판정을 정함([부탁]=건넴, [해냄]=달성) — 전용 공식 캐릭터 e2e-quest를 prepare.mjs에서 심음
- 기존 flaky 시험(심리 탐구 화면): 개발 서버의 /mind 첫 컴파일이 15초를 넘겨 URL 확인이 시간 초과 → 대기 60초로 늘림

**안 한 것**
퀘스트는 캐릭터당 하나. 한 번에 12메시지와 이전 요약만 보고 판정해 여러 대화에 걸친 큰 조건은 약함. 운영 콘솔에서 퀘스트 검토·신고 흐름 없음. 사용자가 만든 퀘스트 내용에 대한 안전 검수(성적·폭력 부탁)는 AI 초안 프롬프트의 금지에만 의존

## 결과

**동작 확인**
- API 단위 테스트 185개(퀘스트 순수 로직 7, 카드 3 추가), 타입 검사 api·web, oxlint, AI import
- e2e quest 9개(진행·문턱 아래·중복 보상·없음·공방 AI/발행·유저 캐릭터 코레딧 없음·화면 3개) 통과, 전체 e2e 100개 통과

**리스크**
로컬 모델의 판정이 가끔 어긋날 수 있음(불확실하면 아님으로 둠)

**후속**
feature/photonet-scene·photonet-rating·secret-quest develop 병합(사용자 확인 후)

**관련 문서**
docs/plan/SECRET_QUEST.md, API_DOCUMENTATION.md, DATABASE.md, CHARACTERS.md
