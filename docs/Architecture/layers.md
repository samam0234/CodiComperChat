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

> **DTO는 ai 스키마와 짝을 맞춰야 한다.** `services/ai/app/schemas/`에는 계약이 정의되어 있는데 Nest에는 아직 DTO가 없다. 계획서 §7.5가 경고한 "세 곳에서 다른 필드명" 드리프트가 생길 수 있는 지점이므로, DTO를 만들 때 ai 스키마의 필드명을 그대로 따른다.

## FastAPI (`services/ai`)

```text
Schema (Pydantic) ── 계약
      ↓
Route (/infer, /summarize, /critique-test) → Service → LLM 클라이언트
   ↑ 실재                                      ↑ 실재(전부 501)   ↑ 아직 없음
```

- Schema: 요청/응답 계약 (`app/schemas/`)
- Route: 요청 검증, 스트림 응답 배선만 (`app/routes/`)
- Service: 프롬프트 조립 마무리, 디렉터 체크, 요약 구조화 (`app/services/`)

### Repository 계층은 여기에 두지 않는다 (의도적)

`services/ai`에는 Repository도 DB 세션도 없다. **빠뜨린 것이 아니라 계획서 §7.4의 제약이다** — "FastAPI는 원본 DB를 함부로 쓰지 않는다. 추론에 필요한 슬라이스만 Nest가 조립해 넘긴다."

DB 접근 계층은 `apps/api`(Nest + Prisma)에만 존재한다. ai에 Repository를 추가하는 것은 경계 위반이므로, 나중에 "없어서 빠뜨린 줄 알고" 만들지 말 것. 읽기 전용 replica를 여는 선택지는 계획서가 열어 두었으나 v1 범위가 아니다.

### 필드명 규약

`app/schemas/base.py`의 `WireModel`을 상속하면 통신 필드명이 camelCase가 된다. 계획서 §7.5가 "프론트 폼 상태·Nest DTO·FastAPI 입력이 같은 뼈대를 공유해야 한다"고 못박았고 TypeScript 쪽이 camelCase이기 때문이다. 파이썬 내부 코드는 snake_case를 쓰고, 두 형태 모두 입력으로 받는다(`populate_by_name`).

`/train`은 스키마도 서비스 계층도 없다. v1 정책상 라우트에서 바로 403으로 닫는다 (계획서 §7.7).

아직 없는 것: LLM 클라이언트, 서비스 토큰 인증(계획서 §7.8), 테스트(pytest).

## 공통 원칙

- 웹은 FastAPI를 모른다 — Nest를 통해서만
- 학습(`/train`) 경로는 v1에서 라우트만 존재, 내부 로직은 막아 둠

관련: [overview.md](overview.md), [../plan/DATABASE.md](../plan/DATABASE.md)
