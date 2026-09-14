# 계층 구조

상태: **코드 미착수 — 목표 계층.** 구현이 시작되면 실제 모듈 경로로 이 문서를 갱신한다 (`docs/plan/HARDCODING_ZONES.md`와 함께).

## Nest.js (`apps/api`)

```text
Controller → Service → Repository (Prisma) → PostgreSQL
```

- Controller: 인증·DTO 검증만. 비즈니스 로직 금지
- Service: 컨텍스트 조립, 캠페인 상태 머지, FastAPI 프록시 호출
- Repository/Prisma: DB 접근만

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
