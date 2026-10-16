# Docker 토폴로지 (목표)

> 상태(2026-10-16): `docker-compose.yml`은 **`postgres` 하나만** 있다(로컬 개발은 설치형 PostgreSQL을 쓴다 · [../guidance/docker-run.md](../guidance/docker-run.md)). web·api·ai 컨테이너는 배포 단계에서 만든다. 아래는 계획서 §7.3 근거의 목표 토폴로지다. Redis는 지금 쓰지 않는다(요청 한도·대기열을 메모리/PostgreSQL로 해결).

## 목표 서비스 구성

```text
compose
├── web        # Next.js (apps/web)
├── api        # Nest.js (apps/api)
├── ai         # FastAPI (services/ai)
├── postgres
└── redis
```

로컬은 이 다섯을 한 번에 올리는 것이 목표다. 배포 시 `web`+`api`와 `ai`는 분리 스케일이 가능하게 둔다 — `ai`가 GPU/호스티드 LLM 비용 때문에 먼저 스케일 대상이 될 가능성이 높다 (계획서 §7.3).

## 아직 정하지 않은 것

- Compose 프로젝트명
- 포트 매핑 (제안값은 `plan/CURRENT_STACK.md` 참고, 미확정)
- 볼륨 전략 (Postgres 데이터, 초상 이미지 등 에셋)

관련: [../plan/CURRENT_STACK.md](../plan/CURRENT_STACK.md), [../web_management/ports-inventory.md](../web_management/ports-inventory.md)
