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

## 페르소나 지식 RAG (2026-09-26 사용자 지시)

캐릭터가 자기 성격·배경을 놓치거나 설정에 없는 사실을 지어내지 않도록, 캐릭터별 설정을 **비공개 JSON**(`apps/api/data/personas/<이름>.json`, git 제외)으로 두고 매 턴 관련 조각만 골라 넣는다. 로컬 소형 모델(Ollama `gemma4:e4b`)은 긴 카드 원문을 받으면 뒷부분을 놓치고 빈칸을 지어내기 쉬워서, 짧은 핵심(`core`) + 검색된 조각 몇 개로 줄인다.

```text
Nest 컨텍스트 조립기 (apps/api/src/persona-rag)
  1. PersonaKnowledgeStore  JSON 로드·형식 검증 (저장하면 몇 초 안에 반영, 깨진 파일은 무시하고 로그)
  2. retriever              유저 말 + 직전 두 턴 → 글자 2-gram BM25 + 키워드 보너스 → 상위 3개(700자 이내)
  3. buildContextSlice      core → directorNote, 검색된 조각 → activeLore
FastAPI 시스템 프롬프트     "이번 대화와 관련된 설정 자료"로 표시 + 끝에 흐름·환각 방지 규칙
```

- 관련 조각이 없으면 아무것도 넣지 않는다 → "설정에 없는 개인적 사실은 지어내지 않는다" 규칙이 작동한다
- 지식 파일이 없는 캐릭터는 예전 방식(카드 원문 전부)으로 대화한다. `PERSONA_RAG=off`로 끌 수 있다
- 비밀·해금 조건은 이 파일에 넣지 않는다(공개 카드 필드만 — 기획서 §7.8). 이 JSON은 저장소에 올라가지 않는다
- 검색은 어휘 기반이다. 임베딩 모델이 로컬에 생기면 같은 인터페이스(질의 → 점수 매긴 조각)로 바꿔 끼울 수 있다
- 만들기·채우기·확인: [`apps/api/data/personas/README.md`](../../apps/api/data/personas/README.md)

## 왜 원문 전체를 매번 안 넣는가

로어·원문을 다 넣으면 최근 장면이 죽는다 (계획서 §11 리스크표). 그래서:
- `Session`/`Message` 원문은 저장만 하고
- `MemoryChunk`(요약·임베딩)만 검색해서 컨텍스트에 넣는다

관련: [../plan/DATABASE.md](../plan/DATABASE.md), [../plan/AI_MODEL_STRATEGY.md](../plan/AI_MODEL_STRATEGY.md)
