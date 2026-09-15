# 계층 구조

상태: **`apps/api`는 Controller → Service까지 실재, Repository 계층은 Prisma 도입 시 추가.**

## Nest.js (`apps/api`)

```text
Controller → Service → Repository (Prisma) → PostgreSQL
   ↑ 실재      ↑ 실재(전부 501)   ↑ 아직 없음
```

- Controller: 인증·DTO 검증만. 비즈니스 로직 금지
- Service: 컨텍스트 조립, 캠페인 상태 머지, FastAPI 프록시 호출
- Repository/Prisma: DB 접근만

현재 모듈: `health`(유일하게 200), `auth`, `characters`, `campaigns`, `studio`. 컨트롤러는 전부 서비스에만 위임하고, 서비스는 `NotImplementedException`을 던진다 — 계층 방향은 처음부터 지키고 내용만 비워둔 상태다.

아직 없는 것: DTO/`ValidationPipe`(class-validator 도입 시), Repository, 인증 가드, CORS 설정(웹이 실제로 API를 호출할 때 추가).

## FastAPI (`services/ai`)

```text
Route (/infer, /summarize, /critique-test) → Service → LLM 클라이언트
```

- Route: 요청 검증, 스트림 응답 배선만
- Service: 프롬프트 조립 마무리, 디렉터 체크, 요약 구조화
- 원본 DB에 직접 접근하지 않는다 — Nest가 조립한 슬라이스만 받는다 (계획서 §7.4)

## 공통 원칙

- 웹은 FastAPI를 모른다 — Nest를 통해서만
- 학습(`/train`) 경로는 v1에서 라우트만 존재, 내부 로직은 막아 둠

관련: [overview.md](overview.md), [../plan/DATABASE.md](../plan/DATABASE.md)
