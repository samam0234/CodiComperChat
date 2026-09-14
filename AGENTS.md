# CodiComperChat — Agent Rules (요약)

이 파일은 Grok/Codex 등 루트 `AGENTS.md`를 자동 로드하는 도구를 위한 요약이다.
전체 규칙(정본)은 `.agents/skills/codicomperchat/SKILL.md`에 있다 — 충돌 시 그 문서가 이긴다.

## 0. 원본 보존 원칙 (최우선, 예외 없음)

루트의 `CodiComperChat_project_plan.md`는 제품 기획 원본이다. **이 문서의 설계 의도·구조·워딩을 사용자 승인 없이 수정·삭제·재작성하지 않는다.** 변경이 필요하면 먼저 사용자에게 확인하고, 승인 시에도 기존 내용을 조용히 지우지 말고 버전을 올리거나 변경 이력을 추가하는 방식으로만 반영한다. 이 원칙은 다른 모든 규칙보다 우선한다.

## 핵심 규칙 (상세는 정본 스킬 참고)

- **커밋 메시지**: `type(scope):` 는 영어, **요약·본문·바닥글은 한국어**. 예: `feat(api): 캠페인 상태 갱신 엔드포인트 추가`
- **커밋 기록 md**: 매 커밋마다 `docs/branchs/commits/`에 `docs/branchs/TEMPLATE.md` 형식으로 남긴다. 생략 금지, 다른 경로 금지.
- **브랜치**: 작업은 `feature/*`에서만, `develop`/`main` 병합은 항상 `git merge --no-ff`. FF·force-push·`.env` 커밋 금지.
- **스택**: Next.js(`apps/web`) · Nest.js(`apps/api`) · FastAPI(`services/ai`) · PostgreSQL/Redis/Prisma. 프론트는 FastAPI를 직접 호출하지 않는다. v1 범위(계획서 §9)를 임의로 넓히지 않는다.

읽는 순서: `.agents/skills/codicomperchat/SKILL.md` → `CodiComperChat_project_plan.md` → `docs/guidance/commit-message.md` → `docs/guidance/branch-merge.md` → `docs/branchs/TEMPLATE.md`
