# 요청 한도를 서버 여러 대가 함께 세는 DB 저장소 추가

| 항목 | 내용 |
|------|------|
| Subject | `feat(security): 요청 한도를 서버 여러 대가 함께 세는 DB 저장소 추가` |
| Full SHA | `6c39285f68191f7d88f806f9709e550dc693857b` |
| Short SHA | `6c39285` |
| Branch | `feature/shared-limits` |
| Parent | `a85e1f5` (feature/billing) |
| Date | 2026-10-15T23:02:04+09:00 |

## 주 내용

- `security/rate-store.ts`: 한도 저장소 인터페이스, 메모리(기본)·PostgreSQL 두 가지
- `RATE_LIMIT_STORE=db`: `rate_limit_buckets` 테이블에 함께 세어 API 서버가 여러 대여도 한도가 늘지 않음
- 웹 e2e의 API 서버를 DB 저장소로 돌림
- `AI_CONCURRENCY`는 서버 한 대 기준이라 대수만큼 늘어난다는 점을 설정 안내·문서에 적음

## 상세

**배경**
사용자 요청("아직 안 된 것 중 배포 빼고 전부 진행"). 요청 한도가 서버 메모리라 서버를 여러 대로 늘리면 대수만큼 한도가 늘어났다(로그인 무차별 대입 방어가 약해짐).

**변경 범위**
apps/api(security, prisma), e2e/servers/api.mjs, docs, .env.example

**기술 포인트**
- Redis를 새로 들이지 않고 이미 있는 PostgreSQL을 썼다(스택을 늘리지 않음). 한 문장 upsert(`ON CONFLICT DO UPDATE` + CASE)로 "창이 끝났으면 1부터, 아니면 +1"을 해 여러 서버가 동시에 세도 빠지는 수가 없다.
- 시각은 앱 서버가 아니라 DB의 `now()`로 정한다 — 서버마다 시계가 조금 달라도 같은 창을 본다.
- 저장소가 잠깐 실패하면 통과시킨다(fail-open). 한도 때문에 사이트 전체가 막히지 않게 하는 선택이고, DB가 죽었다면 로그인·대화도 어차피 안 된다.
- AI 호출 대기열은 서버마다 따로 두었다. 대기열을 DB로 옮기면 "기다리는 답 우선"을 지키기 어렵고 호출마다 DB 왕복이 생긴다. 대신 서버 대수로 `AI_CONCURRENCY`를 나눠 정하라고 적었다.

**안 한 것**
AI 호출 대기열을 서버 사이에 공유하기(대수로 나눠 설정하는 방식으로 대신)

## 결과

**동작 확인**
- 실제 PostgreSQL 시험 3개: 서버 두 대(PrismaClient 두 개)가 동시에 50번 세도 한도 10번만 통과·Retry-After 1~60초 / 창이 끝나면 다시 셈 / 키별로 따로
- API 153개 통과, 타입 검사 통과
- 웹 e2e 전체(DB 저장소로) 통과 — 그 과정에서 결제 브랜치가 깨뜨린 시험 하나를 찾아 결제 브랜치에서 고침(11ed59f)

**리스크**
DB 저장소는 한도가 걸린 요청마다 DB 쓰기가 한 번 생긴다(LLM 호출·로그인 같은 무거운 요청에만 걸려 있어 부담은 작다).

**후속**
배포 구성이 정해지면 서버 대수에 맞춰 RATE_LIMIT_STORE·AI_CONCURRENCY 설정

**관련 문서**
[docs/API_DOCUMENTATION.md](../../API_DOCUMENTATION.md), [docs/plan/TESTING.md](../../plan/TESTING.md)
