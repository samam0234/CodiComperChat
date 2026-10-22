# 공식 캐릭터 seed와 발행 목록 조회 구현

| 항목 | 내용 |
|------|------|
| Subject | `feat(api): 공식 캐릭터 seed와 발행 목록 조회 구현` |
| Full SHA | `43d501b228c3fc2d2d1c98bb7cb8203781288b67` |
| Short SHA | `43d501b` |
| Branch | `feature/character-seed` |
| Parent | `cc83591` |
| Date | 2026-09-16 19:41:54 +0900 |

## 주 내용

- `apps/api/prisma/seed.mjs` 신설 — 유지성 카드를 `name` 기준 upsert
- `CharactersService.findPublished()`가 `NotImplementedException` 대신 `published = true` 캐릭터를 실제 조회
- `prisma.config.ts`의 `migrations.seed`에 seed 명령 등록
- `package.json`에 `prisma:seed` 스크립트 추가
- `docs/plan/CURRENT_STACK.md` 열린 항목 "첫 공식 캐릭터 이름·설정 본문" 해소 표기

## 상세

**배경**
`docs/plan/CHARACTERS.md`(카드)와 `schema.prisma`(그릇)가 각각 준비됐지만, 둘을 잇는 것이 없어 `GET /characters`는 여전히 501이었다. 사용자가 원한 "캐릭터 업로드"의 마지막 조각이다.

**변경 범위**
- 신규: `apps/api/prisma/seed.mjs`
- 수정: `apps/api/src/characters/characters.service.ts`, `apps/api/prisma.config.ts`, `apps/api/package.json`
- 문서: `docs/plan/CURRENT_STACK.md`, `docs/guidance/docker-run.md`

**기술 포인트**
- **Prisma 7에서 seed 설정 위치가 바뀌었다.** 기존 관례대로 `package.json`의 `"prisma": { "seed": ... }`에 넣었더니 `prisma db seed`가 `No seed command configured`로 거부했다. 7부터는 `prisma.config.ts`의 `migrations.seed`가 정본이라 그쪽으로 옮기고 `package.json` 필드는 지웠다.
- **`upsert`를 쓴 이유.** `create`면 seed를 두 번 돌릴 때 캐릭터가 복제된다. `name`에 `@unique`를 걸어 둔 덕에 `where: { name: '유지성' }`로 멱등하게 만들었다. `update: {}`라서 이미 있으면 건드리지 않는다 — 운영자가 DB에서 손본 값을 seed가 덮어쓰지 않는다.
- **카드 본체와 부가 프로필 분리.** §12.2 항목(호칭·말투·아는 것·모르는 것·목표·갈등 씨앗·비밀·해금조건·시작 장면)은 컬럼으로, 키 181/몸무게 70/나이 23/성별/직업은 `profile` JSON으로 넣었다.
- **seed 본문은 카드 원문을 그대로 옮겼다.** 요약하거나 다듬지 않았다. 카드와 DB가 갈라지면 §0 원본 보존 원칙이 파생물에서 깨지기 때문이다.
- `findPublished()`는 `orderBy: { createdAt: 'asc' }`를 붙였다. 공식 캐릭터가 여러 명이 됐을 때 목록 순서가 들쭉날쭉하지 않도록.

**안 한 것**
- **미해금 비밀 필터링.** 지금 `GET /characters`는 `secret`·`secretUnlockCondition`을 그대로 내려준다. §13.3은 "미해금은 제목만 또는 금지 목록"을 요구하지만, 그 판단은 캠페인 상태를 아는 **컨텍스트 조립기**(§10 6번) 몫이다. 캐릭터 목록 API는 캠페인 맥락이 없어 지금 단계에서 자를 근거가 없다. **다만 공개 API가 비밀 본문을 노출하는 상태이므로 후속에서 반드시 다뤄야 한다.**
- **`POST/PATCH /studio/characters`** — 공방을 통한 캐릭터 생성·수정은 §10 8번. 이번엔 조회만.
- **Nest DTO / 응답 직렬화** — Prisma 모델을 그대로 반환한다. ai 스키마(`8a17251`)와 필드명을 맞추는 작업은 별도.
- 두 번째·세 번째 공식 캐릭터.

## 결과

**동작 확인**
- `npm run prisma:seed` 성공
- `psql`로 `characters` 테이블 확인 — `유지성 | guide | t` row 1개
- `GET http://localhost:4000/characters` → 카드 전 항목 + `profile` JSON + `published: true` 정상 반환
- 그 과정에서 `.env` 미로딩 버그를 발견해 직전 브랜치에서 `main.ts`에 `dotenv/config`를 넣어 해결
- 웹(`localhost:3000`) 11개 라우트 200 확인 — 단 아직 이 API를 호출하는 화면은 없다

**리스크**
- 위에 적은 **비밀 본문 노출**이 가장 큰 건이다.
- seed가 `update: {}`라 카드 원고를 고쳐도 기존 DB row에는 반영되지 않는다. 카드를 수정하면 수동으로 갱신하거나 row를 지우고 다시 seed해야 한다.
- 유지성의 비밀·갈등 축은 사용자 확정 전이라 내용이 바뀔 수 있다.

**후속**
- `/characters` 응답에서 미해금 비밀 제외 (또는 공개용 필드만 노출하는 DTO)
- 웹 `/agents` 페이지에서 실제 목록 렌더링 — 지금은 플레이스홀더
- 캠페인 생성 → 세션 → 메시지 흐름 연결 (§10 4~7번)

**관련 문서**
`docs/plan/CHARACTERS.md`, `docs/guidance/docker-run.md`, `docs/plan/CURRENT_STACK.md`, `CodiComperChat_project_plan.md` §10 §12.2 §13.3
