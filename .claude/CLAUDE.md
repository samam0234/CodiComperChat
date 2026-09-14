# CLAUDE.md (어댑터)

정본은 `.agents/skills/codicomperchat/SKILL.md`다. 이 파일은 그 정본을 가리키는 짧은 복제이며, 내용이 어긋나면 정본이 이긴다.

**작업 시작 전 반드시:**
1. `.agents/skills/codicomperchat/SKILL.md` §0 원본 보존 원칙 — 루트 `CodiComperChat_project_plan.md`를 사용자 승인 없이 수정하지 않는다.
2. 커밋: type/scope 영어, 요약·본문·바닥글 한국어 (`docs/guidance/commit-message.md`)
3. 매 커밋마다 `docs/branchs/commits/`에 `docs/branchs/TEMPLATE.md` 형식 기록 (생략 금지)
4. 브랜치: `feature/*`에서 작업, `develop`/`main` 병합은 `--no-ff`만 (`docs/guidance/branch-merge.md`)
5. 스택: Next.js(`apps/web`) / Nest.js(`apps/api`) / FastAPI(`services/ai`), 프론트→FastAPI 직접 호출 금지, v1 범위 임의 확장 금지 (`docs/plan/CURRENT_STACK.md`)

전체 규칙은 `.agents/skills/codicomperchat/SKILL.md` 하나를 읽으면 충분하다.
