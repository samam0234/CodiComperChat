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
| 2026-09-16 | `144adf8` | fix/character-role-badge | 캐릭터 배지를 role 값 대신 공식으로 표시 | [260916_2044_144adf8_character-role-badge_fix-character-role-badge.md](commits/260916_2044_144adf8_character-role-badge_fix-character-role-badge.md) |
| 2026-09-16 | `b1fbb02` | develop (merge) | fix/character-role-badge → develop 병합 (--no-ff) | [260916_2045_b1fbb02_merge-character-role-badge_develop.md](commits/260916_2045_b1fbb02_merge-character-role-badge_develop.md) |
| 2026-09-16 | `c98fcec` | feature/infer-llm | /infer에 실제 LLM 호출 연결 | [260916_2049_c98fcec_infer-llm_feature-infer-llm.md](commits/260916_2049_c98fcec_infer-llm_feature-infer-llm.md) |
| 2026-09-16 | `4532028` | develop (merge) | feature/infer-llm → develop 병합 (--no-ff) | [260916_2049_4532028_merge-infer-llm_develop.md](commits/260916_2049_4532028_merge-infer-llm_develop.md) |
| 2026-09-16 | `3ee5ff1` | feature/character-chat-relay | 캐릭터 카드를 ContextSlice로 변환해 /infer 중계 | [260916_2052_3ee5ff1_character-chat-relay_feature-character-chat-relay.md](commits/260916_2052_3ee5ff1_character-chat-relay_feature-character-chat-relay.md) |
| 2026-09-16 | `9191822` | develop (merge) | feature/character-chat-relay → develop 병합 (--no-ff) | [260916_2053_9191822_merge-character-chat-relay_develop.md](commits/260916_2053_9191822_merge-character-chat-relay_develop.md) |
| 2026-09-16 | `6f86d67` | feature/character-chat-web | 캐릭터 상세에 시작하기 버튼과 채팅 화면 추가 | [260916_2055_6f86d67_character-chat-web_feature-character-chat-web.md](commits/260916_2055_6f86d67_character-chat-web_feature-character-chat-web.md) |
| 2026-09-16 | `0570167` | develop (merge) | feature/character-chat-web → develop 병합 (--no-ff) | [260916_2055_0570167_merge-character-chat-web_develop.md](commits/260916_2055_0570167_merge-character-chat-web_develop.md) |
| 2026-09-16 | `36c5dc5` | fix/web-lan-dev-origin | LAN IP로 접속 시 HMR 차단되는 문제 해결 | [260916_2126_36c5dc5_web-lan-dev-origin_fix-web-lan-dev-origin.md](commits/260916_2126_36c5dc5_web-lan-dev-origin_fix-web-lan-dev-origin.md) |
| 2026-09-16 | `6bf36e0` | develop (merge) | fix/web-lan-dev-origin → develop 병합 (--no-ff) | [260916_2126_6bf36e0_merge-web-lan-dev-origin_develop.md](commits/260916_2126_6bf36e0_merge-web-lan-dev-origin_develop.md) |
| 2026-09-26 | `75bacbf` | feature/ollama-llm | 호스티드 LLM을 Gemini에서 로컬 Ollama(gemma4:e4b)로 교체 | [260926_0103_75bacbf_ollama-llm_feature-ollama-llm.md](commits/260926_0103_75bacbf_ollama-llm_feature-ollama-llm.md) |
| 2026-09-26 | `5165738` | develop (merge) | feature/ollama-llm → develop 병합 (--no-ff) | [260926_0104_5165738_merge-ollama-llm_develop.md](commits/260926_0104_5165738_merge-ollama-llm_develop.md) |
|  | `` |  |  | [260925_2017_28768a2_vscode-python-interpreter_feature-vscode-python-interpreter.md](commits/260925_2017_28768a2_vscode-python-interpreter_feature-vscode-python-interpreter.md) |
|  | `` |  |  | [260925_2018_22f408c_root-readme_feature-root-readme.md](commits/260925_2018_22f408c_root-readme_feature-root-readme.md) |
| 2026-09-25 | `5589736` | develop (merge) | feature/vscode-python-interpreter → develop 병합 (--no-ff) | [260925_2018_5589736_merge-vscode-python-interpreter_develop.md](commits/260925_2018_5589736_merge-vscode-python-interpreter_develop.md) |
| 2026-09-25 | `d792a32` | develop (merge) | feature/root-readme → develop 병합 (--no-ff) | [260925_2018_d792a32_merge-root-readme_develop.md](commits/260925_2018_d792a32_merge-root-readme_develop.md) |
|  | `` |  |  | [260925_2328_27dedee_prisma-client-hoist_fix-prisma-client-hoist.md](commits/260925_2328_27dedee_prisma-client-hoist_fix-prisma-client-hoist.md) |
|  | `` |  |  | [260925_2328_37c0716_merge-user-personas_develop.md](commits/260925_2328_37c0716_merge-user-personas_develop.md) |
|  | `` |  |  | [260925_2328_44e7e9f_merge-gemini-llm_develop.md](commits/260925_2328_44e7e9f_merge-gemini-llm_develop.md) |
|  | `` |  |  | [260925_2328_4f091c9_merge-email-auth_develop.md](commits/260925_2328_4f091c9_merge-email-auth_develop.md) |
|  | `` |  |  | [260925_2328_91f9d86_user-personas_feature-user-personas.md](commits/260925_2328_91f9d86_user-personas_feature-user-personas.md) |
|  | `` |  |  | [260925_2328_9b66f8f_merge-prisma-client-hoist_develop.md](commits/260925_2328_9b66f8f_merge-prisma-client-hoist_develop.md) |
|  | `` |  |  | [260925_2328_9fb0de0_gemini-llm_feature-gemini-llm.md](commits/260925_2328_9fb0de0_gemini-llm_feature-gemini-llm.md) |
|  | `` |  |  | [260925_2328_bffbe07_merge-local-postgres_develop.md](commits/260925_2328_bffbe07_merge-local-postgres_develop.md) |
|  | `` |  |  | [260925_2328_d05d83a_email-auth_feature-auth.md](commits/260925_2328_d05d83a_email-auth_feature-auth.md) |
|  | `` |  |  | [260925_2328_f54e566_local-postgres_feature-local-postgres.md](commits/260925_2328_f54e566_local-postgres_feature-local-postgres.md) |
|  | `` |  |  | [260925_2351_741b0d5_reply-suggestions_feature-reply-suggestions.md](commits/260925_2351_741b0d5_reply-suggestions_feature-reply-suggestions.md) |
|  | `` |  |  | [260925_2351_7dfb314_required-persona_feature-required-persona.md](commits/260925_2351_7dfb314_required-persona_feature-required-persona.md) |
|  | `` |  |  | [260925_2351_8b69fba_agent-llm_feature-agent-llm.md](commits/260925_2351_8b69fba_agent-llm_feature-agent-llm.md) |
|  | `` |  |  | [260925_2352_6c3ba8c_merge-reply-suggestions_develop.md](commits/260925_2352_6c3ba8c_merge-reply-suggestions_develop.md) |
|  | `` |  |  | [260925_2352_a8f64d6_merge-required-persona_develop.md](commits/260925_2352_a8f64d6_merge-required-persona_develop.md) |
|  | `` |  |  | [260925_2352_bd29041_merge-agent-llm_develop.md](commits/260925_2352_bd29041_merge-agent-llm_develop.md) |
|  | `` |  |  | [260926_0038_5d3b969_gemini-model-name_fix-gemini-model-name.md](commits/260926_0038_5d3b969_gemini-model-name_fix-gemini-model-name.md) |
| 2026-09-26 | `c2abc24` | develop (merge) | fix/gemini-model-name → develop 병합 (--no-ff) | [260926_0039_c2abc24_merge-gemini-model-name_develop.md](commits/260926_0039_c2abc24_merge-gemini-model-name_develop.md) |
|  | `` |  |  | [260926_0138_1e0c60e_persona-rag-context_feature-persona-rag-context.md](commits/260926_0138_1e0c60e_persona-rag-context_feature-persona-rag-context.md) |
|  | `` |  |  | [260926_0138_231677e_persona-knowledge-store_feature-persona-knowledge-store.md](commits/260926_0138_231677e_persona-knowledge-store_feature-persona-knowledge-store.md) |
|  | `` |  |  | [260926_0138_791a981_persona-retriever_feature-persona-retriever.md](commits/260926_0138_791a981_persona-retriever_feature-persona-retriever.md) |
| 2026-09-26 | `769dccc` | develop (merge) | feature/persona-retriever → develop 병합 (--no-ff) | [260926_0144_769dccc_merge-persona-retriever_develop.md](commits/260926_0144_769dccc_merge-persona-retriever_develop.md) |
| 2026-09-26 | `a7a4870` | develop (merge) | feature/persona-knowledge-store → develop 병합 (--no-ff) | [260926_0144_a7a4870_merge-persona-knowledge-store_develop.md](commits/260926_0144_a7a4870_merge-persona-knowledge-store_develop.md) |
| 2026-09-26 | `d0016de` | develop (merge) | feature/persona-rag-context → develop 병합 (--no-ff) | [260926_0144_d0016de_merge-persona-rag-context_develop.md](commits/260926_0144_d0016de_merge-persona-rag-context_develop.md) |
| 2026-09-26 | `a4ffebb` | develop (merge) | feature/chat-multiline-input → develop 병합 (--no-ff) | [260926_0151_a4ffebb_merge-chat-multiline-input_develop.md](commits/260926_0151_a4ffebb_merge-chat-multiline-input_develop.md) |
|  | `` |  |  | [260926_0151_de1dfd0_chat-multiline-input_feature-chat-multiline-input.md](commits/260926_0151_de1dfd0_chat-multiline-input_feature-chat-multiline-input.md) |
|  | `` |  |  | [260927_0012_171c216_chat-history_feature-chat-history.md](commits/260927_0012_171c216_chat-history_feature-chat-history.md) |
|  | `` |  |  | [260927_0020_5282d10_chat-memory_feature-chat-memory.md](commits/260927_0020_5282d10_chat-memory_feature-chat-memory.md) |
|  | `` |  |  | [260927_0027_ae49ebb_chat-state_feature-chat-state.md](commits/260927_0027_ae49ebb_chat-state_feature-chat-state.md) |
|  | `` |  |  | [260927_0034_4df26b8_chat-settings-menu_feature-chat-settings-menu.md](commits/260927_0034_4df26b8_chat-settings-menu_feature-chat-settings-menu.md) |
| 2026-09-27 | `49c8422` | develop (merge) | feature/chat-memory → develop 병합 (--no-ff) | [260927_0041_49c8422_merge-chat-memory_develop.md](commits/260927_0041_49c8422_merge-chat-memory_develop.md) |
| 2026-09-27 | `6a37e70` | develop (merge) | feature/chat-history → develop 병합 (--no-ff) | [260927_0041_6a37e70_merge-chat-history_develop.md](commits/260927_0041_6a37e70_merge-chat-history_develop.md) |
| 2026-09-27 | `7206a12` | develop (merge) | feature/chat-state → develop 병합 (--no-ff) | [260927_0041_7206a12_merge-chat-state_develop.md](commits/260927_0041_7206a12_merge-chat-state_develop.md) |
| 2026-09-27 | `d1e1457` | develop (merge) | feature/chat-settings-menu → develop 병합 (--no-ff) | [260927_0041_d1e1457_merge-chat-settings-menu_develop.md](commits/260927_0041_d1e1457_merge-chat-settings-menu_develop.md) |
|  | `` |  |  | [260927_0113_15fe22d_api-stale-dist_fix-api-stale-dist.md](commits/260927_0113_15fe22d_api-stale-dist_fix-api-stale-dist.md) |
| 2026-09-27 | `25a56bc` | develop (merge) | fix/api-stale-dist → develop 병합 (--no-ff) | [260927_0113_25a56bc_merge-api-stale-dist_develop.md](commits/260927_0113_25a56bc_merge-api-stale-dist_develop.md) |
|  | `` |  |  | [261015_0400_561855f_studio-drafts_feature-studio-drafts.md](commits/261015_0400_561855f_studio-drafts_feature-studio-drafts.md) |
|  | `` |  |  | [261015_0411_daf95f2_studio-test_feature-studio-test.md](commits/261015_0411_daf95f2_studio-test_feature-studio-test.md) |
|  | `` |  |  | [261015_0418_6b77d4a_studio-publish_feature-studio-publish.md](commits/261015_0418_6b77d4a_studio-publish_feature-studio-publish.md) |
|  | `` |  |  | [261015_0430_77fc6a0_studio-web_feature-studio-web.md](commits/261015_0430_77fc6a0_studio-web_feature-studio-web.md) |
| 2026-10-15 | `d512c35` | develop (merge) | feature/studio-drafts → develop 병합 (--no-ff) | [261015_0433_d512c35_merge-studio-drafts_develop.md](commits/261015_0433_d512c35_merge-studio-drafts_develop.md) |
| 2026-10-15 | `38f93e7` | develop (merge) | feature/studio-publish → develop 병합 (--no-ff) | [261015_0434_38f93e7_merge-studio-publish_develop.md](commits/261015_0434_38f93e7_merge-studio-publish_develop.md) |
| 2026-10-15 | `9b2fc53` | develop (merge) | feature/studio-test → develop 병합 (--no-ff) | [261015_0434_9b2fc53_merge-studio-test_develop.md](commits/261015_0434_9b2fc53_merge-studio-test_develop.md) |
| 2026-10-15 | `d232d1a` | develop (merge) | feature/studio-web → develop 병합 (--no-ff) | [261015_0434_d232d1a_merge-studio-web_develop.md](commits/261015_0434_d232d1a_merge-studio-web_develop.md) |
|  | `` |  |  | [261015_0525_aa05e14_chat-sessions_feature-chat-sessions.md](commits/261015_0525_aa05e14_chat-sessions_feature-chat-sessions.md) |
|  | `` |  |  | [261015_0539_df0825a_chat-extras_feature-chat-extras.md](commits/261015_0539_df0825a_chat-extras_feature-chat-extras.md) |
|  | `` |  |  | [261015_0546_5451e72_studio-visibility_feature-studio-visibility.md](commits/261015_0546_5451e72_studio-visibility_feature-studio-visibility.md) |
|  | `` |  |  | [261015_0549_cbdafef_prompt-extension_feature-studio-prompt-extension.md](commits/261015_0549_cbdafef_prompt-extension_feature-studio-prompt-extension.md) |
| 2026-10-15 | `574e514` | develop (merge) | feature/chat-sessions → develop 병합 (--no-ff) | [261015_0556_574e514_merge-chat-sessions_develop.md](commits/261015_0556_574e514_merge-chat-sessions_develop.md) |
| 2026-10-15 | `31a5f79` | develop (merge) | feature/studio-prompt-extension → develop 병합 (--no-ff) | [261015_0557_31a5f79_merge-studio-prompt-extension_develop.md](commits/261015_0557_31a5f79_merge-studio-prompt-extension_develop.md) |
| 2026-10-15 | `482e292` | develop (merge) | feature/chat-extras → develop 병합 (--no-ff) | [261015_0557_482e292_merge-chat-extras_develop.md](commits/261015_0557_482e292_merge-chat-extras_develop.md) |
| 2026-10-15 | `af90d19` | develop (merge) | feature/studio-visibility → develop 병합 (--no-ff) | [261015_0557_af90d19_merge-studio-visibility_develop.md](commits/261015_0557_af90d19_merge-studio-visibility_develop.md) |
|  | `` |  |  | [261015_1046_65bb4df_chat-grounding_feature-chat-grounding.md](commits/261015_1046_65bb4df_chat-grounding_feature-chat-grounding.md) |
|  | `` |  |  | [261015_1048_8eee97e_studio-samples_feature-studio-samples.md](commits/261015_1048_8eee97e_studio-samples_feature-studio-samples.md) |
|  | `` |  |  | [261015_1101_2854137_studio-reports_feature-studio-reports.md](commits/261015_1101_2854137_studio-reports_feature-studio-reports.md) |
|  | `` |  |  | [261015_1106_cd9eb88_studio-ai-draft_feature-studio-ai-draft.md](commits/261015_1106_cd9eb88_studio-ai-draft_feature-studio-ai-draft.md) |
|  | `` |  |  | [261015_1116_28f05a3_campaign-state_feature-campaign-state.md](commits/261015_1116_28f05a3_campaign-state_feature-campaign-state.md) |
|  | `` |  |  | [261015_1123_332be48_studio-portrait_feature-studio-portrait.md](commits/261015_1123_332be48_studio-portrait_feature-studio-portrait.md) |
| 2026-10-15 | `f907e65` | develop (merge) | feature/chat-grounding → develop 병합 (--no-ff) | [261015_1136_f907e65_merge-chat-grounding_develop.md](commits/261015_1136_f907e65_merge-chat-grounding_develop.md) |
| 2026-10-15 | `319d500` | develop (merge) | feature/campaign-state → develop 병합 (--no-ff) | [261015_1137_319d500_merge-campaign-state_develop.md](commits/261015_1137_319d500_merge-campaign-state_develop.md) |
| 2026-10-15 | `385b714` | develop (merge) | feature/studio-portrait → develop 병합 (--no-ff) | [261015_1137_385b714_merge-studio-portrait_develop.md](commits/261015_1137_385b714_merge-studio-portrait_develop.md) |
| 2026-10-15 | `40b4442` | develop (merge) | feature/studio-reports → develop 병합 (--no-ff) | [261015_1137_40b4442_merge-studio-reports_develop.md](commits/261015_1137_40b4442_merge-studio-reports_develop.md) |
| 2026-10-15 | `52f451e` | develop (merge) | feature/studio-samples → develop 병합 (--no-ff) | [261015_1137_52f451e_merge-studio-samples_develop.md](commits/261015_1137_52f451e_merge-studio-samples_develop.md) |
| 2026-10-15 | `fc453a7` | develop (merge) | feature/studio-ai-draft → develop 병합 (--no-ff) | [261015_1137_fc453a7_merge-studio-ai-draft_develop.md](commits/261015_1137_fc453a7_merge-studio-ai-draft_develop.md) |
|  | `` |  |  | [261015_1215_daf9ce4_quality-eval_feature-quality-eval.md](commits/261015_1215_daf9ce4_quality-eval_feature-quality-eval.md) |
|  | `` |  |  | [261015_1234_7c53ceb_web-e2e_feature-web-e2e.md](commits/261015_1234_7c53ceb_web-e2e_feature-web-e2e.md) |
|  | `` |  |  | [261015_1243_adbc6db_security-hardening_feature-security-hardening.md](commits/261015_1243_adbc6db_security-hardening_feature-security-hardening.md) |
|  | `` |  |  | [261015_1256_043e40a_pro-plan_feature-pro-plan.md](commits/261015_1256_043e40a_pro-plan_feature-pro-plan.md) |
| 2026-10-15 | `2f998d2` | develop (merge) | feature/security-hardening → develop 병합 (--no-ff) | [261015_1312_2f998d2_merge-security-hardening_develop.md](commits/261015_1312_2f998d2_merge-security-hardening_develop.md) |
| 2026-10-15 | `4081f35` | develop (merge) | feature/quality-eval → develop 병합 (--no-ff) | [261015_1312_4081f35_merge-quality-eval_develop.md](commits/261015_1312_4081f35_merge-quality-eval_develop.md) |
| 2026-10-15 | `5f3fbde` | develop (merge) | feature/web-e2e → develop 병합 (--no-ff) | [261015_1312_5f3fbde_merge-web-e2e_develop.md](commits/261015_1312_5f3fbde_merge-web-e2e_develop.md) |
| 2026-10-15 | `a468bd8` | develop (merge) | feature/pro-plan → develop 병합 (--no-ff) | [261015_1312_a468bd8_merge-pro-plan_develop.md](commits/261015_1312_a468bd8_merge-pro-plan_develop.md) |
|  | `` |  |  | [261015_1312_cd1640d_perf-limits_feature-perf-limits.md](commits/261015_1312_cd1640d_perf-limits_feature-perf-limits.md) |
| 2026-10-15 | `f914430` | develop (merge) | feature/perf-limits → develop 병합 (--no-ff) | [261015_1312_f914430_merge-perf-limits_develop.md](commits/261015_1312_f914430_merge-perf-limits_develop.md) |
|  | `` |  |  | [261015_2235_067d012_auth-email_feature-auth-email.md](commits/261015_2235_067d012_auth-email_feature-auth-email.md) |
| 2026-10-15 | `2c6cd43` | develop (merge) | feature/auth-email → develop 병합 (--no-ff) | [261015_2328_2c6cd43_merge-auth-email_develop.md](commits/261015_2328_2c6cd43_merge-auth-email_develop.md) |
|  | `` |  |  | [261015_2245_9de4510_image-moderation_feature-image-moderation.md](commits/261015_2245_9de4510_image-moderation_feature-image-moderation.md) |
| 2026-10-15 | `349a230` | develop (merge) | feature/image-moderation → develop 병합 (--no-ff) | [261015_2328_349a230_merge-image-moderation_develop.md](commits/261015_2328_349a230_merge-image-moderation_develop.md) |
|  | `` |  |  | [261015_2253_69a9ee8_billing_feature-billing.md](commits/261015_2253_69a9ee8_billing_feature-billing.md) |
|  | `` |  |  | [261015_2301_11ed59f_billing-e2e-fix_feature-billing.md](commits/261015_2301_11ed59f_billing-e2e-fix_feature-billing.md) |
| 2026-10-15 | `92d9c22` | develop (merge) | feature/billing → develop 병합 (--no-ff) | [261015_2328_92d9c22_merge-billing_develop.md](commits/261015_2328_92d9c22_merge-billing_develop.md) |
|  | `` |  |  | [261015_2302_6c39285_shared-limits_feature-shared-limits.md](commits/261015_2302_6c39285_shared-limits_feature-shared-limits.md) |
|  | `` |  |  | [261015_2304_98582ac_rate-store-flaky_feature-shared-limits.md](commits/261015_2304_98582ac_rate-store-flaky_feature-shared-limits.md) |
| 2026-10-15 | `a70dbb3` | develop (merge) | feature/shared-limits → develop 병합 (--no-ff) | [261015_2328_a70dbb3_merge-shared-limits_develop.md](commits/261015_2328_a70dbb3_merge-shared-limits_develop.md) |
|  | `` |  |  | [261015_2305_de62551_ci_feature-ci.md](commits/261015_2305_de62551_ci_feature-ci.md) |
| 2026-10-15 | `8af27ee` | develop (merge) | feature/ci → develop 병합 (--no-ff) | [261015_2328_8af27ee_merge-ci_develop.md](commits/261015_2328_8af27ee_merge-ci_develop.md) |

새 커밋 기록 md를 `commits/`에 추가할 때마다 이 표에도 한 줄씩 추가한다.
