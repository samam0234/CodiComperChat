# 개발·배포 가이드 (목표 절차)

> 상태: **모노레포·의존성 파일이 아직 없다.** 아래는 계획서 §7.3, §7.4를 근거로 한 목표 절차이며, 실제 `package.json`/`docker-compose.yml`/`.env.example`이 생기면 이 문서를 실제 명령으로 교체한다. 지금 이 문서의 명령을 그대로 실행할 수는 없다.

## 사전 준비 체크리스트 (스캐폴딩 전에 정해야 하는 것)

- [ ] 패키지 매니저 (npm / pnpm / yarn workspaces)
- [ ] Node.js / Python 버전 고정
- [ ] `.env.example` 항목: DB 접속 문자열, Redis URL, 호스티드 LLM API 키, 인증 벤더 키
- [ ] `docker-compose.yml`: web / api / ai / postgres / redis 서비스 (계획서 §7.3)
- [ ] Prisma 초기화 위치 (`apps/api`)

## 목표 로컬 기동 순서

```bash
# 1) 저장소 클론 후 의존성 설치 (모노레포 도구 확정 후 채움)
# 2) .env 준비
cp .env.example .env

# 3) DB/Redis만 먼저 컨테이너로
docker compose up -d postgres redis

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
