# Docker 토폴로지 (목표)

> 상태: **`docker-compose.yml`이 아직 저장소에 없다.** 아래는 계획서 §7.3 근거의 목표 토폴로지다. 실제 파일이 생기면 서비스명·포트·프로젝트명을 이 문서에 반영한다.

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
