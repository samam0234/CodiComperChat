# Flask AI 가이드 챗봇을 LangChain·LangGraph·BM25 RAG로 만든다

| 항목 | 내용 |
|------|------|
| Subject | `feat(portfolio): Flask AI 가이드 챗봇을 LangChain·LangGraph·BM25 RAG로 만든다` |
| Full SHA | `ec3b9dc00b8dfcf8ce9b20d43fc0bd3612e3a2a0` |
| Short SHA | `ec3b9dc` |
| Branch | `feature/portfolio` |
| Parent | `d297c1e` |
| Date | 2026-11-07 16:35:50 +0900 |

## 주 내용

- `PortFolio/server/ai_services`: Flask 앱(`/health`, `/graph`, `/chat`), LangGraph 그래프(route → greeting | condense → retrieve → grade → generate | no_context), LangChain RAG(제목·길이 단위 분할, BM25 + 한국어 2-gram), Ollama `gemma4:12b` → 예비 `gemma4:e4b`
- 시험 12개(가짜 채팅 모델), Dockerfile(waitress), README

## 상세

**배경**
사용자가 포트폴리오에 LangChain·RAG·LangGraph를 쓰는 AI 챗봇(Ollama 12b)을 요청했다(2026-11-07).

**변경 범위**
`PortFolio/server/ai_services/` 새 파일.

**기술 포인트**
- BM25 점수만으로는 흔한 낱말 하나로 무관한 질문이 걸린다("고양이 사료 추천" → '추천'). 질문 핵심어(조사·서술어 제거, 한↔영 별칭)의 포함률 0.5 이상만 근거로 본다.
- 긴 절을 나누면 뒤 조각에 제목이 없어 "막힌 과정" 같은 절이 안 찾혔다 → 조각 앞에 절 제목을 붙여 색인.
- `gemma4`의 생각 출력이 답 길이 상한을 다 써 빈 답이 났다 → `reasoning=False`, 빈 답도 실패로 보고 예비 모델로.

**안 한 것**
스트리밍 응답, 벡터 검색.

## 결과

**동작 확인**
`pytest` 12개 통과. 실제 `gemma4:12b`: 첫 호출 102초(적재 포함), 이후 12~56초, 근거 번호와 출처 문서가 붙어 나옴.

**리스크**
`langchain-community`(BM25Retriever)는 유지 종료 예고. 답 품질은 검색 결과에 기대며 놓치는 절이 있을 수 있다.

**후속**
Rails 프록시, Astro 챗봇 화면.
