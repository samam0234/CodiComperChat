# 데이터 흐름

정본: `CodiComperChat_project_plan.md` §7.6, §13.4. 요청/응답 흐름 다이어그램은 [../WORKFLOW.md](../WORKFLOW.md)에 있다 — 이 문서는 상태(State) 관점에서 같은 흐름을 본다.

## 메시지 한 번 보낼 때 상태가 움직이는 순서

```text
1. 유저 메시지 저장 (Message)
2. 컨텍스트 슬라이스 조립
   - Character (핵심 필드)
   - LoreEntry (매칭된 것만)
   - CampaignState (관계·훅·지식)
   - 최근 Message N턴
   - MemoryChunk 검색 K개
3. FastAPI /infer → 스트림 응답
4. 어시스턴트 메시지 저장 (Message)
```

## 세션 종료 시

```text
1. FastAPI /summarize 호출
2. 반환된 { brief, relationDelta, hooksOpen, hooksClosed, knowledgeGained, unlocks, nextPressure }
3. Nest가 CampaignState에 델타 머지 (자유 산문으로 덮어쓰지 않는다 — §13.4)
```

## 왜 원문 전체를 매번 안 넣는가

로어·원문을 다 넣으면 최근 장면이 죽는다 (계획서 §11 리스크표). 그래서:
- `Session`/`Message` 원문은 저장만 하고
- `MemoryChunk`(요약·임베딩)만 검색해서 컨텍스트에 넣는다

관련: [../plan/DATABASE.md](../plan/DATABASE.md), [../plan/AI_MODEL_STRATEGY.md](../plan/AI_MODEL_STRATEGY.md)
