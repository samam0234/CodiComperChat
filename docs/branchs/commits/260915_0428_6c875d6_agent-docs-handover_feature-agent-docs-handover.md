# 에이전트 협업 규칙 정본과 문서 허브 구조 추가

| 항목 | 내용 |
|------|------|
| Subject | `feat(agents): 에이전트 협업 규칙 정본과 문서 허브 구조 추가` |
| Full SHA | `6c875d606e6bd3a07d3befc656b4a20f8dd89532` |
| Short SHA | `6c875d6` |
| Branch | `feature/agent-docs-handover` |
| Parent | `bc275a6` |
| Date | 2026-09-15 04:28:21 +0900 |

## 주 내용

- 정본 스킬 `.agents/skills/codicomperchat/SKILL.md` 추가 (원본 보존 원칙 §0 포함)
- 도구별 어댑터 추가: `.claude/`, `.cursor/`, `.codex/`, `.grok/`, `.antigravity/`, 루트 `AGENTS.md`
- `docs/` 문서 허브 전체 구조 추가: `plan/`, `Architecture/`, `branchs/`, `guidance/`, `find_debug/`, `repeater/`, `vaildates/`, `web_management/`, `trainings/`
- 커밋 메시지·브랜치 병합 규칙을 `guidance/`에 상세화
- 커밋 기록 템플릿(`branchs/TEMPLATE.md`)·목록(`branchs/README.md`)·브랜치 맵(`branchs/BRANCH_MAP.md`) 정비

## 상세

**배경**
여러 AI 에이전트 도구가 이 저장소에서 일관되게 작업하도록, 다른 프로젝트("cutnkeep")의 인수인계 규칙 패턴을 코디컴퍼챗에 맞게 이식했다. 스택(Next.js/Nest.js/FastAPI)과 v1 범위가 다른 프로젝트와 다르므로 내용은 새로 작성하고, 조직 방식(정본+어댑터, 커밋 기록 필수, feature→develop --no-ff)만 재사용했다.

**변경 범위**
`.agents/`, `.claude/`, `.cursor/`, `.codex/`, `.grok/`, `.antigravity/`, 루트 `AGENTS.md`, `docs/` 전체(51개 파일).

**기술 포인트**
- 정본 우선순위: `CodiComperChat_project_plan.md` > `.agents/skills/codicomperchat/SKILL.md` > 루트 `AGENTS.md` > `docs/guidance/*` > 도구별 어댑터
- 원본 보존 원칙(§0)을 모든 어댑터 파일에도 한 줄씩 반복 명시 — 사용자 승인 없는 기획 원본 수정 금지
- 코드가 아직 없는 단계이므로 `plan/`, `Architecture/`, `web_management/` 등의 상당수 문서는 "TBD/미확정"으로 명시하고, 계획서에 없는 사실(포트 확정값 등)은 지어내지 않음

**안 한 것**
- 실제 모노레포(`apps/`, `services/`) 스캐폴딩은 하지 않음 — 그건 `docs/plan/LOGIC_AND_GIT_BRANCH_STRATEGY.md`의 로직 순서 1번(`feature/monorepo-scaffold`)에서 별도 진행
- `git init`은 이전 부트스트랩 커밋(`bc275a6`)에서 이미 처리됨

## 결과

**동작 확인**
`git log --oneline`, `git status --short`로 51개 파일이 의도대로 커밋되었음을 확인.

**리스크**
문서 상당수가 TBD 상태 — 실제 코드가 생기면 `plan/CURRENT_STACK.md`부터 갱신해야 다른 문서와 어긋나지 않음.

**후속**
- `develop`에 `--no-ff` 병합
- 이후 실제 코드 작업은 `docs/plan/LOGIC_AND_GIT_BRANCH_STRATEGY.md`의 feature 브랜치 순서(`feature/monorepo-scaffold` 등)를 따름

**관련 문서**
`docs/README.md`, `docs/plan/CURRENT_STACK.md`, `.agents/skills/codicomperchat/SKILL.md`
