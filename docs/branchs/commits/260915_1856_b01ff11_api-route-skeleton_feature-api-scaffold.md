# Nest.js 라우트 뼈대와 모듈 구조 추가

| 항목 | 내용 |
|------|------|
| Subject | `feat(api): Nest.js 라우트 뼈대와 모듈 구조 추가` |
| Full SHA | `b01ff11ac5d109ca52232f718cfece4e33f619f2` |
| Short SHA | `b01ff11` |
| Branch | `feature/api-scaffold` |
| Parent | `d20708a` |
| Date | 2026-09-15 18:56:13 +0900 |

## 주 내용

- `apps/api` 생성: Nest.js 12 / TypeScript / **ESM** / vitest / oxlint
- 모듈 5개: `health`, `auth`, `characters`, `campaigns`, `studio`
- 기획서 §13.1의 엔드포인트 14개 전부 배선 — `GET /health`만 200, 나머지는 **501**
- 기본 포트 3000 → **4000** (3000은 `apps/web`)
- `@nestjs/mau` 제거로 npm 취약점 5건 → 0건
- e2e 테스트 교체, 루트 워크스페이스 스크립트 4개 추가
- 구현 반영으로 문서 9종 갱신

## 상세

**배경**
기획서 §10의 3번(Nest 인증 + CRUD)에 들어가기 전에, §13.1에서 합의된 API 경계를 먼저 라우트로 고정했다. 경계를 코드로 박아두면 이후 구현이 경계를 넘나드는 일을 줄일 수 있다.

**변경 범위**
- `apps/api/` 전체 (src 17개 파일 + 설정)
- 루트 `package.json`(스크립트), `package-lock.json`, `.gitignore`(`*.tsbuildinfo`)
- 문서: `API_DOCUMENTATION.md`, `plan/CURRENT_STACK.md`, `plan/PROJECT_STRUCTURE.md`, `plan/TESTING.md`, `Architecture/layers.md`, `Architecture/apps.md`, `guidance/getting-started.md`, `web_management/ports-inventory.md`, `docs/README.md`

**기술 포인트**
- Nest 12는 이전 판과 다르다. `"type": "module"` ESM이라 **상대 import에 `.js` 확장자가 필수**이고, 테스트는 Jest가 아니라 **vitest**, 린트는 ESLint가 아니라 **oxlint**로 스캐폴드된다. `docs/plan/TESTING.md`에 "Nest 기본 Jest"라고 적혀 있던 추정을 실제에 맞게 바로잡았다.
- 서비스는 모두 `NotImplementedException`을 던지고 반환 타입은 `never`다. 뼈대 단계에서 가짜 데이터를 돌려주면 프론트가 그것을 진짜로 착각한 채 배선되므로, 미구현은 조용히 성공하는 대신 시끄럽게 실패하게 했다. 기획서 §10 4번의 "가짜 스트림"은 세션 채팅 셸을 만들 때 의도적으로 도입한다.
- 501 메시지에 어느 기획서 단계에서 구현되는지를 한국어로 적어, 응답만 봐도 다음 작업을 알 수 있게 했다.
- `@nestjs/mau`는 Nest CLI가 자동으로 넣는 자체 배포 서비스용 devDependency다. 우리 배포 계획은 Docker(기획서 §7.3)이므로 쓰지 않는데, `npm audit`의 high 2건을 포함한 5건 전부가 이 패키지의 `inquirer`/`tmp`/`undici` 의존에서 나왔다. 제거 후 0건.
- `--skip-git`으로 스캐폴드해 `apps/api/.gitignore`가 생성되지 않았다. 빌드 산출물 `tsconfig.build.tsbuildinfo`가 스테이징되는 것을 발견해 루트 `.gitignore`에 `*.tsbuildinfo`를 추가했다.

**안 한 것**
- DTO / `ValidationPipe` — class-validator 도입은 실제 요청 본문을 받을 때
- Repository 계층 / Prisma — 기획서 §10 2번
- 인증 가드 — 인증 벤더 미정 (기획서 §15)
- **CORS 설정** — 웹이 아직 API를 호출하지 않는다. 실제 호출이 생길 때 허용 오리진과 함께 추가
- `services/ai`(FastAPI) 연동 — 미착수

## 결과

**동작 확인**
- `npm run build:api` 성공, `npx oxlint src/ test/` 경고 0건
- `npm run test:api:e2e` 2건 통과 (health 200 / characters 501)
- 기동 후 라우트 15종 수동 확인: `/health` 200, 나머지 13종 501, 없는 경로 404
- `npm audit` 0건

**리스크**
- 모든 도메인 엔드포인트가 501이라, 프론트가 붙기 전까지 실제 동작은 검증되지 않은 상태다.
- Node/npm 버전을 `engines`로 고정하지 않았다 (web과 동일 상태).

**후속**
- `feature/prisma-schema`: Prisma 스키마와 Repository 계층 (기획서 §10 2번)
- `feature/api-auth-crud`: 인증 + 캐릭터/캠페인 CRUD (§10 3번)
- web↔api 연결 시 CORS 설정

**관련 문서**
`docs/API_DOCUMENTATION.md`, `docs/Architecture/layers.md`, `docs/plan/PROJECT_STRUCTURE.md`, `docs/plan/TESTING.md`
