# 컨텍스트 조립에 페르소나 지식 검색을 연결하고 대화 흐름·환각 방지 규칙 추가

| 항목 | 내용 |
|------|------|
| Subject | `feat(ai): 컨텍스트 조립에 페르소나 지식 검색을 연결하고 대화 흐름·환각 방지 규칙 추가` |
| Full SHA | `1e0c60e0b5fb24ba0be16db248ac1e6dcfee9cc1` |
| Short SHA | `1e0c60e` |
| Branch | `feature/persona-rag-context` |
| Parent | `6e5552f` (feature/persona-retriever) |
| Date | 2026-09-26T01:38:57+09:00 |

## 주 내용

- `PersonaRagService`: 캐릭터 이름으로 지식을 찾아 이번 말 + 직전 대화로 검색, `core`와 검색된 조각을 돌려줌. 대답 추천(유저가 아직 말하기 전)은 마지막 대화로 검색
- `buildContextSlice`: 지식이 있으면 core → `directorNote`, 검색 조각 → `activeLore`. 없으면 카드 원문 전부(하위 호환). `PERSONA_RAG=off`로 끔
- 서버 시작 시 어떤 지식 파일이 로드/무시됐는지 로그
- FastAPI 프롬프트: "캐릭터 핵심 설정"·"이번 대화와 관련된 설정 자료" 라벨, 끝에 흐름·환각 방지 규칙 5개, 온도 0.7. 대답 추천도 설정 자료 참고
- `data/personas/README.md`(만들기·채우기·확인·요령), `.env.example`(`PERSONA_RAG`, `PERSONA_DATA_DIR`), WORKFLOW·data-flow 문서

## 상세

**배경**
지식 저장소와 검색기가 있어도 컨텍스트에 연결돼야 모델이 읽는다. 로컬 소형 모델은 긴 카드 원문에서 뒷부분을 놓치고 빈칸을 지어내기 쉬워, 짧은 핵심 + 관련 조각으로 줄이고 프롬프트 끝에 규칙을 둔다.

**변경 범위**
apps/api(persona-rag 서비스·모듈, character-chat 컨텍스트·서비스·모듈), services/ai(inference, suggestion), 문서, .env.example

**기술 포인트**
기획서가 컨텍스트 조립을 Nest 책임으로 정했으므로 검색도 Nest에 두고, FastAPI 계약은 기존 `activeLore` 필드를 그대로 썼다(스키마 변경 없음). 규칙을 프롬프트 맨 끝에 둔 것은 작은 모델이 끝부분 지시를 더 잘 따르기 때문이다. "형제는 없어요"처럼 없다고 단정하는 것도 지어내기라서 규칙 3번과 안전장치 조각이 단정을 명시적으로 막는다.

**안 한 것**
임베딩 검색, 대화 요약 기반 장기 흐름(세션이 아직 저장되지 않음), 지어낸 답을 사후에 걸러내는 검사(생성 후 검증)는 하지 않았다.

## 결과

**동작 확인**
단위 테스트: 컨텍스트 조립(지식 있음/없음), PersonaRagService(유저 말 검색, 파일 없음 null, PERSONA_RAG=off, 대답 추천 검색). 전체 28개 통과. 실제 Ollama(gemma4:e4b)로 RAG 켬/끔 비교: (1) 시험용 조각(보리차·새벽 달리기)이 든 JSON에서 켠 쪽은 6번 모두 그 설정을 그대로 말했고, 끈 쪽은 "도서관에서 책을 읽는다", "책상 앞에서 시간을 보낸다" 같은 없는 일상을 지어냄. (2) 카드에 없는 개인사(고향·형제·대학·전공): 개선 전 켠 쪽이 5번 중 2번 "고향은 이 근처, 형제는 없다"고 단정 → 안전장치 조각과 규칙 3번을 강화한 뒤 켠 쪽 0/16, 끈 쪽 실제 단정 1/16(+경계선 1). `nest build`, oxlint 통과, FastAPI import·프롬프트 확인.

**리스크**
표본이 작아(질문당 8개) 통계적 차이라고 단정할 수 없다. 소형 모델이라 단정이 완전히 사라지지는 않는다. 2턴 대화의 흐름은 켬/끔 차이를 확인하지 못했다(둘 다 자연스러웠다). 지식 JSON을 사람이 채워야 검색이 유용하다 — 카드 원문만으로는 조각이 7개뿐이다.

**후속**
유지성 배경·관계·습관·말투 예시를 사용자가 확정해 JSON에 채우기, 임베딩 모델을 받으면 검색기 교체, 생성 후 검증

**관련 문서**
[apps/api/data/personas/README.md](../../../apps/api/data/personas/README.md), [docs/Architecture/data-flow.md](../../Architecture/data-flow.md)
