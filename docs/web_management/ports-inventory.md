# 포트 인벤토리

기준 문서: [../plan/CURRENT_STACK.md](../plan/CURRENT_STACK.md). **여기 값이 그 문서와 다르면 CURRENT_STACK이 맞고 이 문서를 고친다.**

| 서비스 | 개발 | e2e(자동 테스트) | 확정 여부 |
|--------|------|------------------|-----------|
| Next.js (`apps/web`) | 3000 | 3101 | **확정** (`npm run dev:web`) |
| Nest.js (`apps/api`) | 4000 | 4101 | **확정** (`PORT` env로 변경 가능) |
| FastAPI (`services/ai`, 내부 전용) | 8000 | 8101 | **확정** (uvicorn `--port 8000`) |
| PostgreSQL | 5432 | 5432 (DB `codicomperchat_e2e`) | **확정** (설치형 서비스, localhost 전용) |
| Ollama | 11434 | 쓰지 않음(가짜 LLM) | 개발용 |
| Mailpit (개발 메일) | 1025 SMTP · 8025 웹 | 쓰지 않음(메일은 폴더로) | 개발용, 127.0.0.1에만 |
| Redis | — | — | 쓰지 않음 |

e2e 포트는 개발 서버와 겹치지 않게 따로 둬서 같이 켜 둬도 된다(`e2e/env.mjs`). `npm run ci:local`도 e2e 포트를 쓰므로 `npm run test:e2e`와 동시에 돌리지 않는다.

FastAPI 포트는 외부에 노출하지 않는다 — Nest만 내부망에서 접근 (계획서 §7.1).
