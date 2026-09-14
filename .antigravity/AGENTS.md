# AGENTS.md (Antigravity 어댑터)

정본은 `.agents/skills/codicomperchat/SKILL.md`다. 어긋나면 정본이 이긴다.

- §0 원본 보존 원칙: 루트 `CodiComperChat_project_plan.md`를 사용자 승인 없이 수정하지 않는다.
- 커밋: type/scope 영어, 요약·본문·바닥글 한국어.
- 매 커밋마다 `docs/branchs/commits/`에 기록(`docs/branchs/TEMPLATE.md`) — 생략 금지.
- 브랜치: `feature/*`에서 작업, `develop`/`main` 병합은 `--no-ff`만.
- 스택: Next.js(`apps/web`) / Nest.js(`apps/api`) / FastAPI(`services/ai`), 프론트→FastAPI 직접 호출 금지.
