# 캐릭터 상세 조회 추가와 비밀 필드 응답 제외

| 항목 | 내용 |
|------|------|
| Subject | `feat(api): 캐릭터 상세 조회 추가와 비밀 필드 응답 제외` |
| Full SHA | `66096b0efa1f9171227f331c5e09863a73fd35c3` |
| Short SHA | `66096b0` |
| Branch | `feature/character-detail-api` |
| Parent | `03b05f0` |
| Date | 2026-09-16 20:23:29 +0900 |

## 주 내용

- `GET /characters/:id` 추가 (계획서 §13.1 목록에는 없던 경로 — 상세 화면을 위해 필요)
- `PUBLIC_FIELDS` 화이트리스트 도입 — `secret`, `secretUnlockCondition`, `published`, `updatedAt`을 응답에서 제외
- 목록(`findPublished`)에도 같은 select 적용
- 발행 안 된 캐릭터 / 없는 id는 404

## 상세

**배경**
직전 커밋(`43d501b`)의 기록에 "**`/characters`가 미해금 비밀 본문을 그대로 노출한다. 후속 필수**"라고 적어 둔 건이다. 상세 페이지를 만들면 이 필드들이 화면 가까이까지 내려오므로 더 미룰 수 없었다.

기획서 §13.3은 컨텍스트 예산 표에서 "비밀(미해금은 제목만 또는 금지 목록)"이라고 못박았고, §7.8은 "해금 전 비밀 키워드가 답변에 나왔는지 정도는 v1에서도 검사 가능"이라며 서버 점검을 요구한다. 검사 이전에 **애초에 내려보내지 않는 것**이 먼저다.

**변경 범위**
- `apps/api/src/characters/characters.service.ts` — `PUBLIC_FIELDS`, `findOnePublished` 추가
- `apps/api/src/characters/characters.controller.ts` — `@Get(':id')` 추가

**기술 포인트**
- **화이트리스트(select)로 갔다.** `omit`이나 응답 후처리로 지우는 방식은 스키마에 새 필드가 늘 때마다 자동으로 새어 나간다. `select`는 새 필드가 생겨도 기본이 "안 나감"이다. 캐릭터 카드처럼 민감 항목이 섞인 모델에는 이쪽이 맞다.
- **`published: true`를 상세에도 걸었다.** 공방에서 작성 중인(미발행) 캐릭터가 id만 알면 보이는 상태가 되면 안 된다. `findUnique`가 아니라 `findFirst`를 쓴 이유다 — 복합 조건(id + published)이 필요했다.
- **Prisma의 `null`을 200으로 흘리지 않는다.** 없는 id면 Prisma는 `null`을 주고 Nest는 그걸 200 + 빈 본문으로 내보낸다. 웹에서 구분하기 어려워 `NotFoundException`으로 바꿨다.
- `published`와 `updatedAt`도 응답에서 뺐다. 목록/상세 모두 발행된 것만 나오므로 `published: true`는 정보가 없고, `updatedAt`은 운영 정보다.

**안 한 것**
- **비밀의 "제목만" 노출** — §13.3은 미해금 비밀을 "제목만" 내려보내는 선택지도 준다. 그러려면 `Character`에 비밀 제목 필드가 따로 있어야 하는데 지금 스키마에는 없다. 캠페인·해금 로직을 만들 때 같이 다룬다.
- **인증/인가** — `/auth/*`가 아직 501이라 "이 캐릭터를 볼 수 있는 사람인가"는 판단하지 않는다. 발행 여부만 본다.
- **DTO 클래스** — Prisma select 결과를 그대로 반환한다. ai 스키마(`8a17251`)와 필드명을 맞추는 DTO 작업은 별도.

## 결과

**동작 확인**
- `npm run build --workspace api` 통과
- `GET /characters` 응답에 `secret` 문자열 없음 (grep 확인)
- `GET /characters/<id>` 200, 반환 필드 14개: id, name, oneLiner, role, addressing, personalityAxes, speechStyle, knows, unknown, goal, conflictSeed, openingScene, profile, createdAt
- `GET /characters/nope` → 404

**리스크**
- `GET /characters/:id`는 **계획서 §13.1의 공개 엔드포인트 목록에 없는 경로**다. 상세 화면에 필요해서 추가했지만, 계획서를 갱신할 때 §0 원칙에 따라 목록에 넣을지 확인이 필요하다.
- `conflictSeed`(갈등 씨앗)와 `unknown`(모르는 것)은 공개로 뒀다. 비밀만큼은 아니어도 일부 스포일러 성격이 있어, 상세 화면 구성에 따라 재검토 여지가 있다.

**후속**
- 웹 캐릭터 상세 페이지에서 이 엔드포인트 소비
- 계획서 §13.1 엔드포인트 목록 갱신 여부 확인
- 해금 로직 설계 시 "비밀 제목만" 필드 추가 검토

**관련 문서**
`CodiComperChat_project_plan.md` §13.1 §13.3 §7.8, `docs/plan/CURRENT_STACK.md`, `docs/API_DOCUMENTATION.md`
