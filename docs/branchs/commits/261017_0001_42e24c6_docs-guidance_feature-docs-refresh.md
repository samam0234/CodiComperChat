# 시작하기·환경변수·운영·API·웹·공방·AI 가이드를 지금 기준으로

| 항목 | 내용 |
|------|------|
| Subject | `docs(guidance): 시작하기·환경변수·운영·API·웹·공방·AI 가이드를 지금 기준으로` |
| Full SHA | `42e24c619316937ad8e23338394a9c663a2881cf` |
| Short SHA | `42e24c6` |
| Branch | `feature/docs-refresh` |
| Parent | `baa1e09` (feature/docs-refresh) |
| Date | 2026-10-17T00:01:53+09:00 |

## 주 내용

- `guidance/getting-started.md`: 새 PC에서 가입 → 대화까지 — 전제(PostgreSQL·Ollama·Chrome), 설치, `.env` 두 개(필수 2개와 AUTH_SECRET 만드는 법), DB 준비(migrate deploy·seed·운영자 만들기), 실행 4개, 기대 결과(개발용 메일 로그·시험 결제), 테스트, 주의(build:api)
- `guidance/environment.md`(신규): api 21개·ai 5개·web 3개·e2e/CI가 읽는 환경변수 표(필수·기본값·무엇), 비밀 값 다루는 규칙, 확인 도구
- `guidance/operations.md`(신규): 운영자 만들기, 신고 처리·초상 검수·계정 등급·환불 절차, 점검 도구와 로그 문구, 탈퇴 계정의 환불
- `guidance/api-usage.md`: 계획서의 목표 예시 → 실제로 되는 curl
- `guidance/web-frontend.md`, `guidance/studio-workshop.md`: "UI 미구현" → 계획서 §5·§6과 지금 구현의 대응표(스트리밍·리롤 없음, 선택지 대신 대답 추천, 발행 조건, 초상 검수, 프로 3배)
- `guidance/ai-pipeline.md`, `plan/AI_MODEL_STRATEGY.md`: 로컬 Ollama, FastAPI 경로 10개, 평가 돌리기, 안전장치 현황
- `apps/api/scripts/user-role.mjs` 주석: "공방 발행은 운영자만"(옛 규칙) → 지금 규칙

## 상세

**배경**
사용자 요청(문서 업데이트). 가이드 문서들이 "`.env` 아직 필요 없음", "나머지는 501이 정상", "UI 미구현"으로 남아 있어 새로 온 사람이 따라 하면 틀렸다. SKILL.md §7: guidance는 전제 → 명령 → 기대결과, 포트/ENV는 표로.

**변경 범위**
docs/guidance(getting-started, environment·operations 신규, api-usage, web-frontend, studio-workshop, ai-pipeline), docs/plan/AI_MODEL_STRATEGY.md, apps/api/scripts/user-role.mjs(주석)

**기술 포인트**
- 환경변수 표는 코드에서 `process.env.*`·`os.environ`을 모아 만들었다(가격은 `process.env[env]`로 동적으로 읽어 따로 확인).
- 화면 설명은 실제 코드로 확인해 고쳤다: 대화 ⋮ 메뉴는 4개(대화 목록·저장한 대화·메모리·상태설정), 공방 "캠페인 밀도 부족" 경고는 서버 readiness가 계산, 좁은 화면은 "미리보기 / 폼 보기" 버튼.
- 운영 가이드에 탈퇴한 계정의 결제는 /admin/users로 찾을 수 없다는 점을 적었다(계정이 지워져 결제사 관리 화면에서 처리).

**안 한 것**
없음

## 결과

**동작 확인**
- 문서 속 명령·경로·기본값을 코드·package.json과 대조

**리스크**
없음

**후속**
문서 허브·포트·검증 체크리스트 갱신

**관련 문서**
[docs/guidance/environment.md](../../guidance/environment.md), [docs/guidance/operations.md](../../guidance/operations.md)
