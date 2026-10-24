# 개발·배포 가이드 (목표 절차)

> 상태(2026-10-24): **개발 절차는 실제로 정해졌다** — 지금 따라 할 순서는 [../guidance/getting-started.md](../guidance/getting-started.md), 환경변수는 [../guidance/environment.md](../guidance/environment.md). 아래 "목표" 절은 계획서 §7.3·§7.4의 배포 목표로 남겨 둔다(컨테이너화·배포는 아직). 계획과 달라진 점: npm workspaces로 정함, Redis는 쓰지 않음, `.env`는 `apps/api`·`services/ai` 두 곳.

## 사전 준비 체크리스트 (스캐폴딩 때 정한 것 — 모두 정해짐)

- [x] 패키지 매니저: npm workspaces(`apps/*`, `console`)
- [x] Node 24 / Python 3.12 (`services/ai/.venv`)
- [x] `.env.example`: `apps/api`·`services/ai` 두 곳 — 전체 표 [../guidance/environment.md](../guidance/environment.md) (Redis URL은 없다, 쓰지 않는다)
- [x] `docker-compose.yml`: postgres·mailpit(개발용). web·api·ai 컨테이너는 배포 단계
- [x] Prisma 위치: `apps/api`

## 목표 로컬 기동 순서

```bash
# 1) 저장소 클론 후 의존성 설치 (모노레포 도구 확정 후 채움)
# 2) .env 준비
cp .env.example .env

# 3) DB(설치형이 없을 때만)·메일 서버를 컨테이너로 — Redis는 쓰지 않는다
docker compose up -d postgres mailpit

# 4) Prisma 마이그레이션 (apps/api)
# npx prisma migrate dev

# 5) 각 앱 개발 서버 (별도 터미널)
# apps/web  : Next.js dev
# apps/api  : Nest.js dev
# services/ai : FastAPI dev (uvicorn)
```

## 목표 배포 그림 (계획서 §7.3)

web·api와 ai를 분리 배포할 수 있게 둔다. ai가 GPU/호스티드 LLM 비용 때문에 먼저 스케일 대상이 될 가능성이 높다.

## 하지 말 것

- 이 문서의 명령이 "지금 실행된다"고 보고하지 않는다 — 실제 파일이 생긴 뒤에만 검증된 것으로 표시한다
- 포트/서비스명은 이 문서가 아니라 [CURRENT_STACK.md](CURRENT_STACK.md)에서 확정하고 여기는 그것을 참조한다

관련: [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md), [../DEPLOYMENT.md](../DEPLOYMENT.md), [../web_management/docker-deploy.md](../web_management/docker-deploy.md)
