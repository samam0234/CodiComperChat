# 캐릭터 카드를 ContextSlice로 변환해 /infer 중계

| 항목 | 내용 |
|------|------|
| Subject | `feat(api): 캐릭터 카드를 ContextSlice로 변환해 /infer 중계` |
| Full SHA | `3ee5ff16e8b5da30323c7077262da28b60d68577` |
| Short SHA | `3ee5ff1` |
| Branch | `feature/character-chat-relay` |
| Parent | `0b8b087` |
| Date | 2026-09-16 20:52:36 +0900 |

## 주 내용

- `POST /characters/:id/chat` 신설 — Character → `ContextSlice` 변환 → FastAPI `/infer` 호출 → relay
- `apps/api/src/character-chat/{controller,service,module,context,types}.ts`
- `CharactersModule`이 `CharactersService`를 export하도록 변경

## 상세

**배경**
FastAPI `/infer`가 실제로 LLM을 부를 수 있게 됐지만(`c98fcec`), 그건 이미 조립된 `ContextSlice`를 받는 자리다(§7.4 "FastAPI는 DB를 직접 보지 않는다"). Character를 그 구조로 조립해 넘기는 쪽이 없었다.

**변경 범위**
신규 `apps/api/src/character-chat/*`, 수정 `apps/api/src/characters/characters.module.ts`, `apps/api/src/app.module.ts`

**기술 포인트**
- **캠페인 없이 미리보기로 대화한다.** "캐릭터 상세 → 시작하기 → 바로 대화"가 요청 흐름이라, `Campaign`/`Session`을 만들지 않는다. 만들려면 `userId`가 필요한데 `/auth/*`가 아직 501이라 가짜 유저를 만드는 것보다, 지금 필요한 만큼만(미리보기 채팅) 구현하는 쪽을 택했다.
- **드리프트를 정공법으로 안 풀고 안전하게 우회했다.** ai 스키마의 `CharacterCore`는 수치화된 성격 축(`warmth` 등)을 요구하는데 Prisma `Character`는 자유 텍스트 카드다(§12.2 형식). 수치를 억지로 추정하는 대신 중립값 50으로 채우고, 카드 원문 전체를 `directorNote`에 실어 실제 색깔은 거기서 나오게 했다. `8a17251` 기록이 경고한 "드리프트"가 현실화된 지점이라, 근본적으로는 두 스키마를 맞추는 작업이 필요하다는 걸 여기 남겨 둔다.
- **비밀은 여기서도 못 본다.** `CharactersService.findOnePublished`가 이미 `secret`을 select에서 뺀다(`66096b0`). `lockedSecretTopics`에 캐릭터별 구체 문구 대신 일반화된 한 줄만 넣은 건 이 구조적 제약 때문이다 — 없는 데이터를 지어내지 않았다.
- `retrievedMemories`(§13.3 "장기 기억 검색" = RAG 자리)는 빈 배열로 둔다. 검색 대상이 될 과거 세션·요약이 아직 하나도 없어서, 지금 벡터 스토어를 붙여도 항상 빈 결과만 돈다.

**안 한 것**
- **벡터 DB/RAG 구현** — 위 이유로 지금은 무의미하다. 세션이 쌓이고 `MemoryChunk`(§7.5 핵심 도메인, 아직 스키마 밖)가 생기면 여기 채운다.
- **스트리밍** — FastAPI가 아직 단발 응답이라 relay도 단발.
- **캠페인 영속화** — 이 미리보기 대화는 어디에도 저장되지 않는다. 새로고침하면 사라진다.

## 결과

**동작 확인**
- `npm run build --workspace api` 통과
- FastAPI를 8001에 띄우고 `AI_BASE_URL=http://localhost:8001`로 Nest 기동 → `POST /characters/<id>/chat` → 503 + FastAPI가 준 문구 그대로 relay 확인
- 없는 캐릭터 → 404, 빈 메시지 → 400

**리스크**
- 성격 축 중립값(50) 근사가 남아 있다 — 캐릭터가 늘어나면 스키마 정합 작업이 필요하다.
- 인증이 없어 누구나 어떤 공식 캐릭터든 호출 가능하다. LLM 비용이 실제로 발생하기 시작하면 문제.

**후속**
- 웹 "시작하기" 버튼 + 채팅 화면
- 두 스키마(Prisma Character ↔ ai CharacterCore) 정합
- 세션이 쌓이면 retrievedMemories 채우기

**관련 문서**
`services/ai/app/schemas/context.py`, `CodiComperChat_project_plan.md` §7.4 §13.3, `docs/Architecture/layers.md`
