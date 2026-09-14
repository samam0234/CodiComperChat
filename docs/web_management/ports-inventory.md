# 포트 인벤토리

기준 문서: [../plan/CURRENT_STACK.md](../plan/CURRENT_STACK.md). **여기 값이 그 문서와 다르면 CURRENT_STACK이 맞고 이 문서를 고친다.**

| 서비스 | 제안 포트 | 확정 여부 |
|--------|-----------|-----------|
| Next.js (`apps/web`) | 3000 | 미정 |
| Nest.js (`apps/api`) | 4000 | 미정 |
| FastAPI (`services/ai`, 내부 전용) | 8000 | 미정 |
| PostgreSQL | 5432 | 미정 |
| Redis | 6379 | 미정 |

FastAPI 포트는 외부에 노출하지 않는다 — Nest만 내부망에서 접근 (계획서 §7.1).
