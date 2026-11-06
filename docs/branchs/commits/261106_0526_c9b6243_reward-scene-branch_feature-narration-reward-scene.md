# 달성 판정 때 보상 장면 갈래를 골라 그 장면만 넘김

| 항목 | 내용 |
|------|------|
| Subject | `fix(quests): 달성 판정 때 보상 장면 갈래를 골라 그 장면만 넘김` |
| Full SHA | `c9b6243107040ceaf901e9d12283da34049e453a` |
| Short SHA | `c9b6243` |
| Branch | `feature/narration-reward-scene` |
| Parent | `1a2b532` |
| Date | 2026-11-06 05:26:09 +0900 |

## 주 내용

- 퀘스트 달성 판정 때 보상 장면의 갈래를 고르고, 첫 답에는 그 장면 하나만 넘긴다
- 갈래는 코드가 `…라면:` 머리말로 원문 그대로 나누고, 모델은 번호만 고른다
- 보상 평가를 고르기 → 연기 두 단계로 바꾸고 고르기 사례 6개를 더했다

## 상세

**배경**
2026-11-06 평가에서 이세연 보상 장면이 2/8이었다(충돌 0/4). 사용자가 미달 항목을 고치라고 요청했다(2026-11-06). 연기 모델이 두 갈래 중 하나를 고르지 못하고 혼인 갈래의 대사를 섞었다.

**변경 범위**
AI: `summarization.py`(`reward_branches`, `pick_reward_scene`), `schemas/summarize.py`(`reward` 입력, `quest_scene` 출력), `evals/quest_reward.py`, `tests/test_narration_reward.py`.
API: `quests/quest.ts`(`QuestState.scene`, `QuestCheck.scene`, `questNote`), `quests.service.ts`(판정에 `reward` 전달), `campaign-story.service.ts`(`questScene` 반영), `quest.spec.ts`.

**기술 포인트**
처음에는 판정 모델에게 맞는 갈래 글을 옮겨 쓰게 했는데 늘 첫 갈래를 옮겼다(고르기 1/2). 나누기를 코드로 빼고 달성 조건(갈래 설명)과 함께 번호만 고르게 하자 6/6이 됐다. 번호가 틀리거나 갈래가 하나면 빈 문자열을 돌려주고, Nest는 전처럼 전체를 넘긴다. 고른 장면은 원문 일부라 지어낸 장면이 들어가지 않는다.

**안 한 것**
DB 스키마는 바꾸지 않았다(`questState` JSON에 `scene`만 더함). 달성 판정과 코레딧 로직은 그대로다.

## 결과

**동작 확인**
실제 모델로 `quest_reward --repeat 10` 20/20, 갈래 고르기 6/6. 고치기 전 같은 날 2/8. API 시험 211개, AI 단위 36개, e2e 117개, 타입 검사, 린트 통과.

**리스크**
머리말이 `…라면:`·`…다면:` 형식이 아닌 유저 캐릭터 보상은 나누지 못해 전과 같이 전체를 넘긴다.

**후속**
없음.

**관련 문서**
[narration-and-reward.md](../../trainings/narration-and-reward.md), [SECRET_QUEST.md](../../plan/SECRET_QUEST.md)
