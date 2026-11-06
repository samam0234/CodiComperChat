# 로컬 PostgreSQL (현재) / Docker로 띄우기 (목표)

> 개발용 메일 서버(Mailpit)는 Docker로 띄운다: `docker compose up -d mailpit` → SMTP `127.0.0.1:1025`, 받은 메일 `http://127.0.0.1:8025`. 이때 `postgres` 컨테이너는 띄우지 않는다(설치형 PostgreSQL과 5432가 겹친다) — 서비스 이름을 꼭 붙인다. 설정은 [getting-started.md](getting-started.md) "환경변수".

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

`docker-compose.yml`은 개발 보조용이고 `postgres`와 `mailpit`만 있다. 앱까지 컨테이너로 띄우는 운영 구성은 [`deploy/docker-compose.prod.yml`](../../deploy/docker-compose.prod.yml)이다: [../web_management/docker-deploy.md](../web_management/docker-deploy.md).

```bash
docker compose up -d postgres     # 설치형 PostgreSQL을 쓰지 않을 때만
cd apps/api
npx prisma migrate deploy
npm run prisma:seed               # 공식 캐릭터 유지성·이세연
```

### 알려진 이슈: `prisma generate`가 "Could not resolve @prisma/client"로 실패할 때

npm workspaces 호이스팅 때문에 `@prisma/client`가 루트 `node_modules`에만 있고 `apps/api/node_modules/@prisma/`에는 없으면 Prisma 7 CLI가 못 찾는다. 아래로 로컬 심볼릭 링크를 만들면 해결된다 (한 번만 하면 됨, `node_modules`는 git 추적 대상 아님):

```bash
cd apps/api/node_modules/@prisma
ln -s ../../../../node_modules/@prisma/client client
```

## 월드코퍼챗과 DB (2026-11-06)

`npx prisma migrate deploy`가 월드 테이블 9개를 더한다. 장면 그림·지도는 DB(`bytea`)에 들어가 데이터 폴더가 커진다(세계관당 최대 약 12MB). 개발 DB를 비우고 싶으면 `delete from worlds;`(플레이·메시지·이벤트·그림이 함께 지워진다). README 그림용 데모 DB는 `codicomperchat_readme`로 따로다.
