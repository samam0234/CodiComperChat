# README·에이전트 문서에 mermaid 그림과 문법 검사기 추가

| 항목 | 내용 |
|------|------|
| Subject | `docs: README·에이전트 문서에 mermaid 그림과 문법 검사기 추가` |
| Full SHA | `c6c8e03701ef4f5dcb60a9233de8c53b7fb9de1e` |
| Short SHA | `c6c8e03` |
| Branch | `feature/docs-mermaid` |
| Parent | `3bced11` |
| Date | 2026-11-06 16:27:28 +0900 |

## 주 내용

- README·앱별 README·보안·제3자 고지·에이전트 정본·어댑터 37개 문서에 mermaid 그림을 더했다(문서에 따라 여러 개)
- 모든 mermaid 블록을 실제 mermaid 11로 파싱하는 `scripts/check-mermaid.mjs`를 더했다

## 상세

**배경**
사용자가 텍스트 상자 말고 mermaid도, 필요한 곳에는 여러 개 넣으라고 했다(2026-11-06).

**변경 범위**
`README.md`(시스템 구조·1:1 대화 순서도·월드 순서도·퀘스트 상태도), `SECURITY.md`(신뢰 경계·수위 판단·그림 검수), `THIRD_PARTY_NOTICES.md`, `apps/*/README.md`, `console/README.md`, `services/ai/README.md`(경로 지도·프롬프트 순서), `e2e/README.md`, `scripts/readme-media/README.md`, 페르소나·그림 폴더 README, 정본 SKILL(규칙 흐름·gitGraph·우선순위), 루트 AGENTS·어댑터 24개, `scripts/check-mermaid.mjs`.

**기술 포인트**
mermaid는 로직 구조 텍스트 상자 바로 뒤에 둔다. flowchart·sequenceDiagram·stateDiagram·erDiagram·gitGraph를 내용에 맞게 골랐다. 라벨은 모두 따옴표로 감싸 괄호·한글이 문법을 깨지 않게 했다. 어댑터·스킬 포인터는 어긋남 시험이 `## `·`- ` 줄을 보므로 제목 없이 넣었다.

**안 한 것**
기획 원본과 Next 자동 생성 파일.

## 결과

**동작 확인**
`node scripts/check-mermaid.mjs` 실패 0. 어댑터·기록 작성기 시험 36개 통과.

**리스크**
검사기는 파싱만 하고 화면 모양은 보지 않는다.

**후속**
docs 문서.

**관련 문서**
[docs/README.md](../../README.md)
