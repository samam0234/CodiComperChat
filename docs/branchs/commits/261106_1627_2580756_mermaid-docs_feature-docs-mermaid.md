# docs 전체 문서에 mermaid 그림 추가

| 항목 | 내용 |
|------|------|
| Subject | `docs: docs 전체 문서에 mermaid 그림 추가` |
| Full SHA | `25807568e638d66eccd417e643faee196e6f2370` |
| Short SHA | `2580756` |
| Branch | `feature/docs-mermaid` |
| Parent | `75b4346` |
| Date | 2026-11-06 16:27:32 +0900 |

## 주 내용

- docs의 모든 문서(71개)에 mermaid 그림을 더했다. 흐름이 여럿인 문서에는 여러 개(예: data-flow 5개, API_DOCUMENTATION·WORKFLOW·WORLD_COPPERCHAT 4개)

## 상세

**배경**
사용자 요청(2026-11-06): 텍스트 상자 말고 mermaid도, 필요한 부분에 여러 개.

**변경 범위**
`docs/**/*.md`(커밋 기록 제외). TESTING에 그림 확인 명령 표, docs/README에 검사기 안내.

**기술 포인트**
문서 내용에 맞는 그림을 골랐다: 대화·월드 한 턴과 이벤트 보상은 sequenceDiagram(잠금·OPEN 행·한도), 비밀 퀘스트·파트는 stateDiagram, 테이블 관계는 erDiagram, 브랜치는 gitGraph, 오류 응답 고르기·수위·값 두는 곳은 판단 flowchart, 이용자 여정은 journey, 작은 모델 규칙은 mindmap. 같은 그림을 여러 문서가 쓸 때는 한 원본에서 넣어 내용이 같다.

**안 한 것**
글 본문은 바꾸지 않았다.

## 결과

**동작 확인**
`node scripts/check-mermaid.mjs`: 161개 블록, 108개 문서, 실패 0. 기록 작성기·어댑터 시험 36개 통과.

**리스크**
구조가 바뀌면 상자 그림과 mermaid를 함께 고쳐야 한다.

**후속**
병합.

**관련 문서**
[plan/TESTING.md](../../plan/TESTING.md)
