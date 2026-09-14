# 시작하기 (목표 절차)

> 상태: **모노레포가 아직 없다.** 이 문서는 스캐폴딩이 생긴 뒤 실제 명령으로 채운다. 근거·상세는 [../plan/DEVELOPMENT_AND_DEPLOYMENT_GUIDE.md](../plan/DEVELOPMENT_AND_DEPLOYMENT_GUIDE.md).

## 전제 조건 (확정되면 여기 채움)

- Node.js 버전: TBD
- Python 버전: TBD
- 패키지 매니저: TBD
- `.env` 필요 항목: DB 접속 문자열, Redis URL, 호스티드 LLM API 키, 인증 벤더 키 (벤더 자체는 미정)

## 목표 명령 (실제 파일 생기기 전까지는 예시일 뿐)

```bash
cp .env.example .env
docker compose up -d postgres redis
# apps/api: npx prisma migrate dev
# apps/web, apps/api, services/ai 각각 dev 서버 기동
```

## 기대 결과 (목표)

- `apps/web` 개발 서버 접속 시 홈 화면 (진행 중 캠페인 없음 상태)
- `apps/api` 헬스체크 응답
- `services/ai` `/infer`가 Nest를 통해서만 응답 (직접 호출 시 403 또는 미노출이어야 함)

관련: [docker-run.md](docker-run.md), [../plan/CURRENT_STACK.md](../plan/CURRENT_STACK.md)
