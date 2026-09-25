# 로컬 PostgreSQL (현재) / Docker로 띄우기 (목표)

## 로컬 PostgreSQL (현재 개발 환경)

로컬 개발 DB는 Docker가 아니라 **Windows에 설치한 PostgreSQL 16**을 쓴다. 프로그램과 데이터 모두 D드라이브다.

| 항목 | 값 |
|------|-----|
| 설치 위치 | `D:\PostgreSQL\16` (실행 파일은 `bin\`) |
| 데이터 위치 | `D:\PostgreSQL\16\data` |
| 서비스 | `postgresql-x64-16` (시작 유형 자동 — PC를 켜면 같이 뜬다) |
| 접속 범위 | `localhost`만 (`listen_addresses = 'localhost'`) |
| Host / Port | `localhost` / `5432` |
| 앱 계정 / DB | `codicomperchat` / `codicomperchat` (비밀번호는 `apps/api/.env`의 `DATABASE_URL`) |
| 슈퍼유저 | `postgres` (설치 시 지정한 개발용 비밀번호) |

`apps/api/.env`의 `DATABASE_URL`은 그대로 쓴다. 새 환경(다른 PC)에서는 아래 순서로 만든다.

```powershell
# 1) 설치 (관리자 PowerShell). 컴포넌트/서비스명 옵션을 넣으면 설치기가 종료 코드 1로 실패했다 — 아래 인자만 쓴다
winget download --id PostgreSQL.PostgreSQL.16 --source winget --download-directory .\pg
.\pg\<받은 설치파일>.exe --mode unattended --unattendedmodeui none --prefix "D:\PostgreSQL\16" --datadir "D:\PostgreSQL\16\data" --superpassword "<슈퍼유저 비밀번호>" --serverport 5432

# 2) 로컬에서만 접속되게 제한 (설치 기본값은 모든 네트워크 허용) + 서비스 재시작
$env:PGPASSWORD="<슈퍼유저 비밀번호>"
D:\PostgreSQL\16\bin\psql.exe -U postgres -h localhost -c "ALTER SYSTEM SET listen_addresses = 'localhost';"
Restart-Service postgresql-x64-16

# 3) 앱 계정·DB 생성 (migrate dev의 shadow DB용으로 CREATEDB 필요)
D:\PostgreSQL\16\bin\psql.exe -U postgres -h localhost -c "CREATE ROLE codicomperchat LOGIN CREATEDB PASSWORD '<.env와 같은 값>';"
D:\PostgreSQL\16\bin\psql.exe -U postgres -h localhost -c "CREATE DATABASE codicomperchat OWNER codicomperchat;"

# 4) 테이블·seed
cd apps/api
npx prisma migrate deploy
npx prisma db seed
```

- 아래 Docker 절차는 **선택**이다. 로컬 PostgreSQL과 Docker postgres는 둘 다 5432를 쓰므로 동시에 켜지 않는다.
- Docker 시절 데이터는 named volume `codicomperchat_postgres_data`에 남아 있다(내용은 seed 캐릭터 1건뿐이라 옮기지 않고 seed를 다시 넣었다). 필요 없으면 `docker volume rm codicomperchat_postgres_data`로 지운다.

---

## Docker로 띄우기 (선택)

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
