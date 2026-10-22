# Prisma 코어 스키마와 postgres 로컬 구성 추가

| 항목 | 내용 |
|------|------|
| Subject | `feat(db): Prisma 코어 스키마와 postgres 로컬 구성 추가` |
| Full SHA | `f7b00a265de058e3b88da5cc4d2779bc4ea512fc` |
| Short SHA | `f7b00a2` |
| Branch | `feature/prisma-schema` |
| Parent | `2331787` |
| Date | 2026-09-16 19:39:54 +0900 |

## 주 내용

- `apps/api/prisma/schema.prisma` 신설 — `User` `Character` `Campaign` `CampaignState` `Session` `Message` 6모델
- 테이블명 확정: `users` `characters` `campaigns` `campaign_states` `sessions` `messages` (계획서 §7.5가 "Prisma 단계에서 확정"이라고 유보한 것)
- `PrismaModule`(`@Global`) + `PrismaService`를 `AppModule`에 연결
- `apps/api/prisma.config.ts` — Prisma 7의 새 설정 파일 (CLI용 DB URL)
- `docker-compose.yml` 신설 — `postgres:16-alpine`, 5432
- 첫 마이그레이션 `20260916102836_init_core_schema` 생성·적용
- `apps/api/.env.example` — `DATABASE_URL` 템플릿

## 상세

**배경**
사용자가 유지성 캐릭터를 "실제로 업로드"하길 원했는데, 확인해 보니 올릴 곳 자체가 없었다. `CharactersService.findPublished()`는 `NotImplementedException("발행된 캐릭터 목록은 아직 구현되지 않았다 (Prisma 스키마 이후, 기획서 10장 2~3번)")`를 던지고 있었고, Prisma도 postgres도 `docker-compose.yml`도 리포에 없었다.

즉 기획서 §10 진행 순서의 2번(Prisma 스키마)이 통째로 비어 있었다. 사용자에게 "Character 모델만 최소로" vs "§10 2번 전체 스키마"를 물어 **전체 스키마**를 선택받았다.

**변경 범위**
- 신규: `apps/api/prisma/schema.prisma`, `apps/api/prisma.config.ts`, `apps/api/prisma/migrations/`, `apps/api/src/prisma/{prisma.module,prisma.service}.ts`, `apps/api/.env.example`, `docker-compose.yml`
- 수정: `apps/api/src/app.module.ts`, `apps/api/src/main.ts`, `apps/api/package.json`, `package-lock.json`
- 문서: `docs/plan/CURRENT_STACK.md`, `docs/guidance/docker-run.md`

**기술 포인트**
- **Prisma 7의 설정 구조 변경.** `datasource { url = env("DATABASE_URL") }`가 더 이상 지원되지 않는다(P1012). 연결 정보가 두 갈래로 갈렸다: 마이그레이션·generate 같은 **CLI는 `prisma.config.ts`의 `datasource.url`**, **런타임 `PrismaClient`는 `@prisma/adapter-pg` 드라이버 어댑터**. `PrismaService` 생성자에서 `new PrismaPg({ connectionString: process.env.DATABASE_URL })`를 넘긴다.
- **버전 핀 고정.** `npm i prisma @prisma/client`를 그냥 돌리면 CLI는 `8.0.0-rc.15`, 클라이언트는 `7.10.0`이 깔린다. npm 레지스트리의 `latest` 태그가 두 패키지에서 엇갈려 있기 때문이다(prisma의 `latest`가 RC). 메이저가 갈리면 스키마 호환이 깨지므로 둘 다 `7.10.0`으로 맞췄다.
- **`main.ts`에 `dotenv/config` 추가.** Nest는 `.env`를 자동으로 읽지 않는다. 이게 없으면 `process.env.DATABASE_URL`이 `undefined`가 되고, pg가 `SASL: client password must be a string`으로 죽는다. CLI 쪽은 `prisma.config.ts`가 따로 로드한다.
- **`Character.profile`을 `Json?`으로 뒀다.** 유지성에게는 키·몸무게·나이가 있지만 §12.2 카드 항목에는 그런 필드가 없다. 캐릭터마다 있을 수도 없을 수도 있는 부가 프로필을 컬럼으로 박으면 한 캐릭터에 스키마를 맞추는 꼴이라, 카드 본체(§12.2 항목)만 컬럼으로 두고 나머지는 JSON으로 분리했다.
- **`Character.name`에 `@unique`.** seed를 여러 번 돌려도 같은 캐릭터가 늘어나지 않도록 upsert 키가 필요했다. 공식 캐릭터 이름이 겹칠 이유도 없다.
- `CampaignState`는 §13.3~13.4를 따라 `relationshipValue` + `relationshipNote`(근거 한 줄) + `openHooks` + `unlockedSecrets` + `briefForNextSession`으로 구성했다. §4.2가 "숫자만 두지 않는다"고 한 요구를 컬럼으로 반영한 것.
- `Session`에 `@@unique([campaignId, index])` — "이 캠페인의 2회차"라는 감각(§2.2 약점 4번)이 DB 제약으로 남도록.

**안 한 것**
- **`LoreEntry` · `MemoryChunk`** — §7.5 핵심 도메인이지만 §10 2번 목록에 없다. 로어·장기기억 단계에서 추가한다.
- **seed와 `/characters` 구현** — 다음 브랜치(`feature/character-seed`).
- **web/api/ai 컨테이너화, redis** — `docker-compose.yml`에 postgres만 넣었다. 계획서 line 372는 5개 서비스를 한 번에 올리는 것을 목표로 하지만, 각 앱 Dockerfile 작성은 이번 범위 밖이다. `docker-run.md`에 미완 상태를 명시했다.
- **인증·`User` seed** — 모델만 만들고 실제 사용자 생성 로직은 없다.

## 결과

**동작 확인**
- `npx prisma validate` 통과
- `npx prisma generate` 성공 (v7.10.0)
- `docker compose up -d postgres` → `pg_isready` 확인
- `npx prisma migrate dev --name init_core_schema` → 6테이블 생성 성공
- `npm run build --workspace api` 타입 에러 없음

**리스크**
- **npm workspaces 호이스팅 이슈.** `@prisma/client`가 루트 `node_modules`에만 깔리고 `apps/api/node_modules/@prisma/`에는 `dev`만 있으면 `prisma generate`가 `Could not resolve @prisma/client`로 실패한다. 심볼릭 링크로 우회했고 `docker-run.md`에 해결법을 적어 뒀지만, `npm install`을 다시 돌리면 링크가 사라질 수 있다. 근본 해결은 아니다.
- `.env.example`의 계정/비밀번호가 `codicomperchat/codicomperchat`이다. 로컬 전용 기본값이고 실제 `.env`는 `.gitignore`에 걸려 있지만, 배포 단계에서 반드시 교체해야 한다.
- Prisma 8 RC가 이미 `latest` 태그를 달고 있어서, 나중에 의존성을 갱신할 때 의도치 않게 메이저가 올라갈 수 있다.

**후속**
- 공식 캐릭터 seed + `GET /characters` 구현
- Nest DTO를 ai 스키마(`8a17251`)와 필드명 맞춰 작성 — §7.5 드리프트 경고
- `LoreEntry` · `MemoryChunk` 추가
- redis·앱 컨테이너를 compose에 추가

**관련 문서**
`docs/plan/CURRENT_STACK.md`, `docs/guidance/docker-run.md`, `docs/plan/DATABASE.md`, `CodiComperChat_project_plan.md` §7.5 §10 §13.3
