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
| 2026-09-15 | `448b009` | feature/ai-scaffold | FastAPI 추론 서비스 라우트 뼈대 추가 | [260915_2228_448b009_ai-route-skeleton_feature-ai-scaffold.md](commits/260915_2228_448b009_ai-route-skeleton_feature-ai-scaffold.md) |
| 2026-09-15 | `8a17251` | feature/ai-scaffold | 요청·응답 스키마 계층 추가 | [260915_2255_8a17251_ai-schema-layer_feature-ai-scaffold.md](commits/260915_2255_8a17251_ai-schema-layer_feature-ai-scaffold.md) |
| 2026-09-16 | `82d5fe9` | feature/character-card | 공식 캐릭터 유지성 카드 추가 | [260916_1937_82d5fe9_character-card-yujisung_feature-character-card.md](commits/260916_1937_82d5fe9_character-card-yujisung_feature-character-card.md) |
| 2026-09-16 | `8be7b6d` | develop (merge) | feature/character-card → develop 병합 (--no-ff) | [260916_1938_8be7b6d_merge-character-card_develop.md](commits/260916_1938_8be7b6d_merge-character-card_develop.md) |
| 2026-09-16 | `f7b00a2` | feature/prisma-schema | Prisma 코어 스키마와 postgres 로컬 구성 추가 | [260916_1939_f7b00a2_prisma-core-schema_feature-prisma-schema.md](commits/260916_1939_f7b00a2_prisma-core-schema_feature-prisma-schema.md) |
| 2026-09-16 | `77c4328` | develop (merge) | feature/prisma-schema → develop 병합 (--no-ff) | [260916_1940_77c4328_merge-prisma-schema_develop.md](commits/260916_1940_77c4328_merge-prisma-schema_develop.md) |
| 2026-09-16 | `43d501b` | feature/character-seed | 공식 캐릭터 seed와 발행 목록 조회 구현 | [260916_1941_43d501b_character-seed-and-list_feature-character-seed.md](commits/260916_1941_43d501b_character-seed-and-list_feature-character-seed.md) |
| 2026-09-16 | `6ae5ef7` | develop (merge) | feature/character-seed → develop 병합 (--no-ff) | [260916_1942_6ae5ef7_merge-character-seed_develop.md](commits/260916_1942_6ae5ef7_merge-character-seed_develop.md) |
| 2026-09-16 | `e8721fa` | develop (merge) | feature/ai-scaffold → develop 병합 (--no-ff) | [260916_1953_e8721fa_merge-ai-scaffold_develop.md](commits/260916_1953_e8721fa_merge-ai-scaffold_develop.md) |
| 2026-09-16 | `96c042e` | feature/character-list-web | 홈·인기에 공식 캐릭터 목록 렌더링 | [260916_2021_96c042e_character-list-web_feature-character-list-web.md](commits/260916_2021_96c042e_character-list-web_feature-character-list-web.md) |
| 2026-09-16 | `7f1fa8e` | develop (merge) | feature/character-list-web → develop 병합 (--no-ff) | [260916_2022_7f1fa8e_merge-character-list-web_develop.md](commits/260916_2022_7f1fa8e_merge-character-list-web_develop.md) |
| 2026-09-16 | `66096b0` | feature/character-detail-api | 캐릭터 상세 조회 추가와 비밀 필드 응답 제외 | [260916_2023_66096b0_character-detail-api_feature-character-detail-api.md](commits/260916_2023_66096b0_character-detail-api_feature-character-detail-api.md) |
| 2026-09-16 | `441b825` | develop (merge) | feature/character-detail-api → develop 병합 (--no-ff) | [260916_2024_441b825_merge-character-detail-api_develop.md](commits/260916_2024_441b825_merge-character-detail-api_develop.md) |
| 2026-09-16 | `ffb513a` | feature/character-detail-web | 캐릭터 상세 페이지와 카드 링크 추가 | [260916_2026_ffb513a_character-detail-web_feature-character-detail-web.md](commits/260916_2026_ffb513a_character-detail-web_feature-character-detail-web.md) |
| 2026-09-16 | `abe8473` | develop (merge) | feature/character-detail-web → develop 병합 (--no-ff) | [260916_2026_abe8473_merge-character-detail-web_develop.md](commits/260916_2026_abe8473_merge-character-detail-web_develop.md) |
| 2026-09-16 | `821d58a` | feature/agent-chat | 에이전트 챗봇 UI와 메시지 중계 경로 추가 | [260916_2028_821d58a_agent-chat_feature-agent-chat.md](commits/260916_2028_821d58a_agent-chat_feature-agent-chat.md) |
| 2026-09-16 | `4300294` | develop (merge) | feature/agent-chat → develop 병합 (--no-ff) | [260916_2029_4300294_merge-agent-chat_develop.md](commits/260916_2029_4300294_merge-agent-chat_develop.md) |

새 커밋 기록 md를 `commits/`에 추가할 때마다 이 표에도 한 줄씩 추가한다.
