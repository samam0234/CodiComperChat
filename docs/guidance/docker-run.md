# Docker로 띄우기 (목표)

> 상태: **`docker-compose.yml` 없음.** 상세 근거는 [../Architecture/docker-topology.md](../Architecture/docker-topology.md), 포트는 [../plan/CURRENT_STACK.md](../plan/CURRENT_STACK.md) (미확정).

## 목표 서비스

| 서비스 | 스택 |
|--------|------|
| web | Next.js |
| api | Nest.js |
| ai | FastAPI |
| postgres | PostgreSQL |
| redis | Redis |

## 목표 명령

```bash
docker compose up --build
docker compose up -d postgres redis   # DB/캐시만 먼저 띄우고 앱은 로컬 dev로 돌릴 때
```

실제 `docker-compose.yml`이 생기면 서비스명·볼륨·환경변수를 이 문서에 반영한다.
