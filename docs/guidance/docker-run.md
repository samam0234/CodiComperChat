# Docker로 띄우기 (목표)

> 상태: **`docker-compose.yml`에 `postgres`만 있음.** web/api/ai/redis 컨테이너화는 아직. 상세 근거는 [../Architecture/docker-topology.md](../Architecture/docker-topology.md), 포트는 [../plan/CURRENT_STACK.md](../plan/CURRENT_STACK.md) (미확정).

## 목표 서비스

| 서비스 | 스택 | 현재 |
|--------|------|------|
| web | Next.js | 미포함 |
| api | Nest.js | 미포함 |
| ai | FastAPI | 미포함 |
| postgres | PostgreSQL | **포함** (`postgres:16-alpine`, 5432, 계정/DB `codicomperchat`) |
| redis | Redis | 미포함 |

## 지금 되는 명령

```bash
docker compose up -d postgres
```

## apps/api에서 Prisma 붙이기

전제: 위 명령으로 postgres가 떠 있고, `apps/api/.env`가 `apps/api/.env.example`을 복사한 상태(`DATABASE_URL`).

```bash
cd apps/api
npm run prisma:migrate    # 최초 1회: 마이그레이션 생성 + 적용
npm run prisma:seed       # 공식 캐릭터 seed (현재: 유지성)
```

기대 결과: `users` `characters` `campaigns` `campaign_states` `sessions` `messages` 6개 테이블 생성 + `characters`에 `published = true`인 유지성 row 1개. `GET /characters` (Nest API 기동 후)가 이 row를 반환한다.

### 알려진 이슈: `prisma generate`가 "Could not resolve @prisma/client"로 실패할 때

npm workspaces 호이스팅 때문에 `@prisma/client`가 루트 `node_modules`에만 있고 `apps/api/node_modules/@prisma/`에는 없으면 Prisma 7 CLI가 못 찾는다. 아래로 로컬 심볼릭 링크를 만들면 해결된다 (한 번만 하면 됨, `node_modules`는 git 추적 대상 아님):

```bash
cd apps/api/node_modules/@prisma
ln -s ../../../../node_modules/@prisma/client client
```

## web/api/ai 컨테이너화 (아직 안 함)

`docker compose up --build`로 앱까지 한 번에 띄우려면 각 앱에 Dockerfile을 만들고 이 파일에 서비스를 추가해야 한다. 별도 작업으로 남겨 둔다.
