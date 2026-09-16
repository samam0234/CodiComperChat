# 브랜치·커밋 기록

이 폴더는 브랜치·병합 전략(`docs/guidance/branch-merge.md`)과, 매 커밋마다 남기는 상세 기록(`commits/`)을 모은다.

- 템플릿: [TEMPLATE.md](TEMPLATE.md)
- 커밋 기록 저장 위치: `docs/branchs/commits/` (다른 경로 금지)
- 작성 규칙 정본: `.agents/skills/codicomperchat/SKILL.md` §4

## 커밋 기록 목록

| 날짜 | 커밋 | 브랜치 | 요약 | 문서 |
|------|------|--------|------|------|
| 2026-09-15 | `bc275a6` | main | 저장소 초기화 및 기획 원본 추가 | [260915_0427_bc275a6_repo-bootstrap_main.md](commits/260915_0427_bc275a6_repo-bootstrap_main.md) |
| 2026-09-15 | `6c875d6` | feature/agent-docs-handover | 에이전트 협업 규칙 정본과 문서 허브 구조 추가 | [260915_0428_6c875d6_agent-docs-handover_feature-agent-docs-handover.md](commits/260915_0428_6c875d6_agent-docs-handover_feature-agent-docs-handover.md) |
| 2026-09-15 | `bac9d11` | develop (merge) | feature/agent-docs-handover → develop 병합 (--no-ff) | [260915_0429_bac9d11_merge-agent-docs-handover_develop.md](commits/260915_0429_bac9d11_merge-agent-docs-handover_develop.md) |
| 2026-09-15 | `884633c` | feature/monorepo-scaffold | 전역 셸(헤더·드로어·푸터)과 라우트 뼈대 추가 | [260915_0455_884633c_web-app-shell_feature-monorepo-scaffold.md](commits/260915_0455_884633c_web-app-shell_feature-monorepo-scaffold.md) |
| 2026-09-15 | `29cf966` | develop (merge) | feature/monorepo-scaffold → develop 병합 (--no-ff) | [260915_1847_29cf966_merge-monorepo-scaffold_develop.md](commits/260915_1847_29cf966_merge-monorepo-scaffold_develop.md) |
| 2026-09-15 | `b01ff11` | feature/api-scaffold | Nest.js 라우트 뼈대와 모듈 구조 추가 | [260915_1856_b01ff11_api-route-skeleton_feature-api-scaffold.md](commits/260915_1856_b01ff11_api-route-skeleton_feature-api-scaffold.md) |
| 2026-09-15 | `2459d57` | develop (merge) | feature/api-scaffold → develop 병합 (--no-ff) | [260915_2221_2459d57_merge-api-scaffold_develop.md](commits/260915_2221_2459d57_merge-api-scaffold_develop.md) |
| 2026-09-16 | `82d5fe9` | feature/character-card | 공식 캐릭터 유지성 카드 추가 | [260916_1937_82d5fe9_character-card-yujisung_feature-character-card.md](commits/260916_1937_82d5fe9_character-card-yujisung_feature-character-card.md) |
| 2026-09-16 | `8be7b6d` | develop (merge) | feature/character-card → develop 병합 (--no-ff) | [260916_1938_8be7b6d_merge-character-card_develop.md](commits/260916_1938_8be7b6d_merge-character-card_develop.md) |
| 2026-09-16 | `f7b00a2` | feature/prisma-schema | Prisma 코어 스키마와 postgres 로컬 구성 추가 | [260916_1939_f7b00a2_prisma-core-schema_feature-prisma-schema.md](commits/260916_1939_f7b00a2_prisma-core-schema_feature-prisma-schema.md) |

새 커밋 기록 md를 `commits/`에 추가할 때마다 이 표에도 한 줄씩 추가한다.
