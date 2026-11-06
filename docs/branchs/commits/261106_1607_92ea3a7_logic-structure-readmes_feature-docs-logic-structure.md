# README·에이전트 문서에 로직 구조 상자 그림 추가

| 항목 | 내용 |
|------|------|
| Subject | `docs: README·에이전트 문서에 로직 구조 상자 그림 추가` |
| Full SHA | `92ea3a7aefe6549e688e8aa295716ff167cfc2fe` |
| Short SHA | `92ea3a7` |
| Branch | `feature/docs-logic-structure` |
| Parent | `d6fb670` |
| Date | 2026-11-06 16:07:27 +0900 |

## 주 내용

- 루트·앱별 README, SECURITY, THIRD_PARTY_NOTICES, 페르소나 README, 그림 폴더 README에 "로직 구조" 상자 그림을 넣었다
- 에이전트 정본·루트 AGENTS·도구별 어댑터 24개에 규칙이 흐르는 순서 그림을 넣었다

## 상세

**배경**
사용자가 README부터 모든 md 파일에 로직 구조도를 만들어 어떤 구조로 가는지 정확히 설명하라고 했다(2026-11-06). 이미지가 아니어도 되고 상자 도구를 써도 된다고 했다.

**변경 범위**
`README.md`(목차에 링크 추가), `apps/api|web/README.md`, `console/README.md`, `services/ai/README.md`, `e2e/README.md`, `scripts/readme-media/README.md`, `apps/api/data/personas/README.md`, `docs/.assets/README.md`, `SECURITY.md`, `THIRD_PARTY_NOTICES.md`, `AGENTS.md`, `.agents/**`, 도구별 어댑터 폴더.

**기술 포인트**
GitHub 어디서나 그대로 보이게 ```text 블록 안에 상자 그리기 문자로 그렸다. 문서마다 첫 `## ` 앞에 `## 로직 구조`로 넣었다. 어댑터·스킬 포인터는 어긋남 시험이 `## `와 `- ` 줄을 보므로 제목 없이 끝에 붙였다. 정본의 우선순위 그림은 1장 순서(기획 원본 > 정본 > 루트 AGENTS > …)와 맞췄다. 같은 문서에 두 번 넣지 않게 `<!-- logic-structure -->` 표시를 둔다.

**안 한 것**
기획 원본(§0, 승인 없이 수정 금지)과 Next가 자동으로 다시 쓰는 `apps/web|console/{AGENTS,CLAUDE}.md`는 넣지 않았다.

## 결과

**동작 확인**
기록 작성기·어댑터 시험 36개 통과.

**리스크**
없음.

**후속**
docs 폴더.

**관련 문서**
[.agents/README.md](../../../.agents/README.md)
