# API 문서 (경계 초안)

> 상태: **라우트 뼈대만 존재.** `GET /health`를 제외한 모든 엔드포인트는 라우팅만 되어 있고 **501 Not Implemented**를 반환한다. 요청/응답 스키마는 Prisma 스키마와 DTO가 생기면 채운다. 상세 DB는 [plan/DATABASE.md](plan/DATABASE.md).

정본: `CodiComperChat_project_plan.md` §13.1, §13.2

## Base

| 앱 | Base URL | 상태 |
|----|----------|------|
| api (Nest.js) | `http://localhost:4000` | 기동 확인됨 (`npm run dev:api`) |
| ai (FastAPI, 내부 전용) | `http://localhost:8000` | 기동 확인됨. Nest만 호출, 웹은 직접 호출 금지. 대화형 문서 `/docs` |

## Nest.js — 웹이 치는 엔드포인트

| 메서드/경로 | 용도 | 현재 |
|-------------|------|------|
| `GET /health` | 헬스체크 | **200** `{ status, service, timestamp, ai }` — `ai`는 AI 호출 대기열 상태(`inFlight`, `waitingForeground`, `waitingBackground`, `concurrency`) |
| `POST /auth/signup` | 이메일 회원가입 `{ email, password, displayName }`. 인증 메일을 보낸다 | **201** `{ token, user }` (`user.emailVerified: false`) · 중복 이메일 409 · 형식 오류 400 |
| `POST /auth/login` | 로그인 `{ email, password }` | **200** `{ token, user }` · 실패 401 (이메일·비밀번호 중 무엇이 틀렸는지 구분하지 않음) |
| `POST /auth/logout` | 로그아웃 | **204** (토큰이 상태 없는 JWT라 서버가 지울 것이 없다. 쿠키 삭제는 웹이 한다) |
| `GET /auth/me` | 내 계정 | **200** `{ id, email, displayName, role, plan, createdAt }` · `role`은 `USER`/`ADMIN`(운영 표시용. 2026-10-15부터 공방 발행은 누구나라 발행 권한에는 쓰지 않는다) · `plan`은 지금 적용되는 요금 등급(`FREE`/`PRO`, PRO 만료 시각이 지났으면 `FREE`) · 🔒 |
| `PATCH /auth/me` | 표시 이름 변경 `{ displayName }` | **200** · 🔒 |
| `POST /auth/me/password` | 비밀번호 변경 `{ currentPassword, newPassword }`. 다른 기기의 로그인은 끊긴다 | **200** `{ token }` (이 기기용 새 토큰) · 현재 비밀번호 틀림 401 · 🔒 |
| `POST /auth/me/verify-email` | 인증 메일 다시 보내기 | **200** `{ alreadyVerified }` · 🔒 |
| `POST /auth/verify-email` | 메일 링크의 토큰으로 이메일 인증 `{ token }` (24시간, 한 번만) | **200** `{ verified: true }` · 만료·재사용 400 |
| `POST /auth/password/forgot` | 비밀번호 재설정 링크 메일 `{ email }` | **204** (가입 여부와 상관없이 같음) |
| `POST /auth/password/reset` | 새 비밀번호 `{ token, newPassword }` (30분, 한 번만). 모든 기기의 로그인이 끊긴다 | **204** · 만료·재사용 400 |

| `GET /me/personas` | 내 프로필 캐릭터(주인공) 목록 | **200** `[{ id, name, description, updatedAt }]` · 🔒 |
| `POST /me/personas` | 프로필 캐릭터 생성 `{ name(1~20자), description?(~300자) }` | **201** · 10개 초과 409 · 🔒 |
| `PATCH /me/personas/:id` | 수정 | **200** · 남의 것/없음 404 · 🔒 |
| `DELETE /me/personas/:id` | 삭제 | **204** · 남의 것/없음 404 · 🔒 |
| `GET /characters` | 홈·인기 캐릭터 목록 | **200** `[공개 필드…, visibility]` · 각 항목에 `official`(운영 캐릭터인가)·`portraitMime`(초상이 있으면 형식, 없으면 null)·`updatedAt`(초상 캐시 무효화용). **공개(PUBLIC)만**. 링크 공개·비공개는 나오지 않는다 |
| `GET /characters/:id` | 캐릭터 상세 | **200** 공개 필드(비밀·해금 조건 제외) · 공개·링크 공개는 누구나, 비공개는 만든 사람만(토큰을 보내면 판단). 남의 비공개 캐릭터는 없는 것과 같은 404 · 대화·메모리·상태설정·엑스트라 API도 같은 규칙 · 응답에 `official`(운영 캐릭터인가)·`mine`(내가 만들었는가)이 붙는다(ownerId는 싣지 않음). **운영자가 내린 캐릭터는 목록·상세·대화·메모리·상태설정·엑스트라 모두 404**(만든 사람도) |
| `GET /characters/:id/portrait` | 흉상 초상 이미지 | **200** 이미지 본문(`image/webp`·`jpeg`·`png`) · 공개·링크 공개는 누구나(`Cache-Control: public, max-age=300`), 비공개는 만든 사람만(`private, no-store`), 내려간 캐릭터·초상 없음은 404. `nosniff`와 `Content-Security-Policy: sandbox`를 붙여 그림 안의 스크립트가 실행되지 않게 한다 |
| `GET /characters/:id/chat` | 이 캐릭터와의 **지금 대화** | **200** `{ started, persona, savedCount, messages: [{ id, role, text, speaker, createdAt }] }` (최근 200개). 대화 전이면 `started: false`와 시작 장면 1개. `persona`(`{ id, name }` 또는 null)는 이 대화에 고정된 내 프로필 · 🔒 |
| `POST /characters/:id/chat` | 캐릭터와 대화 `{ message(~2000자), personaId }` | **200** `{ reply }` · 🔒 · `personaId` 필수(없으면 400), 남의 프로필 404, **이 대화에 고정된 프로필과 다르면 409**(첫 메시지 때 고정, 새로하기 전까지 유지. 프로필을 나중에 고치거나 지워도 이 대화는 처음 고른 이름·소개로 진행) · LLM 요청 한도 초과 429. **대화 기록은 서버에 저장된 것(최근 30턴)을 쓰고 요청의 `history`는 무시한다.** 답을 받은 뒤에만 유저 말·답을 함께 저장한다(실패한 턴은 남지 않음). 첫 메시지 때 대화(Campaign)를 만들고 시작 장면을 첫 메시지로 남긴다 **엑스트라:** 적용한 엑스트라 중 이번 유저 말·최근 3턴에 조건 단어(또는 이름)가 나온 것만(턴당 최대 2명) `context.extras`로 넘긴다. 조건에 안 맞으면 아예 안 보낸다 **이야기 상태:** 대화가 3번 오갈 때(메시지 6개)마다 답을 돌려준 뒤 뒤에서 FastAPI `/summarize`로 지난 이야기 요약·친밀도 변화·복선을 정리한다(저장하고 새로하기를 할 때도 한 번 더). 열린 복선·끝난 일은 항상, 지난 이야기 요약은 대화가 길어져 앞부분이 최근 30턴에서 밀려났을 때만 프롬프트에 넣는다 |
| `GET /characters/:id/report/reasons` | 신고 사유 목록 | **200** `[{ value, label }]` (SEXUAL · VIOLENCE · HATE · PRIVACY · COPYRIGHT · SPAM · OTHER) · 🔒 |
| `POST /characters/:id/report` | 캐릭터 신고 `{ reason, detail?(~500자) }` | **204** · 로그인한 누구나. 보이는(공개·링크 공개, 안 내려간) 캐릭터만, 없으면 404 · 내 캐릭터 400 · 사유 없음·기타인데 내용 없음 400 · 같은 캐릭터에 열린 신고가 있으면 409 · 한 사람이 열어 둔 신고 20건 상한 · 🔒 |
| `GET /admin/reports` | 운영자 신고함 | **200** `{ reasons, open: [{ character: { id, name, oneLiner, visibility, owner }, reports: [{ id, reason, detail, createdAt, reporter }] }], takenDown: [{ id, name, takenDownAt, takedownReason, owner }] }` · **운영자(ADMIN)만**, 아니면 403(DB의 role을 매번 읽는다). 신고가 많은 캐릭터가 위로 · 🔒 |
| `POST /admin/characters/:id/take-down` | 캐릭터 내리기 `{ note(~300자, 필수) }` | **204** · 열린 신고를 모두 처리됨으로. 사유는 만든 사람에게 보인다 · 운영자만 · 🔒 |
| `POST /admin/characters/:id/dismiss-reports` | 신고 기각 `{ note? }` | **204** · 열린 신고가 없으면 404 · 운영자만 · 🔒 |
| `POST /admin/characters/:id/restore` | 내린 캐릭터 복구 | **204** · 내려간 캐릭터가 아니면 404 · 운영자만 · 🔒 |
| `POST /characters/:id/chat/new` | 새로하기 `{ save }` | **200** `{ saved, ...GET /chat 응답 }` · `save: true`면 지금 대화를 저장한 대화로 남기고(제목 = 첫 유저 말 30자), 아니면 지운다(기억·상태설정 포함). 한 마디도 안 한 대화는 저장하지 않는다. 프로필 고정이 풀린다 · 🔒 |
| `GET /characters/:id/chat/saved` | 이어하기 목록 | **200** `{ character, currentHasMessages, saved: [{ id, title, personaName, savedAt, updatedAt, messageCount, memoryCount, lastMessage }] }` · 🔒 |
| `POST /characters/:id/chat/saved/:campaignId/resume` | 이어하기 `{ saveCurrent }` | **200** GET /chat 응답 · 저장한 대화를 지금 대화로 되살린다(내용·기억·상태설정·고정 프로필 그대로). 지금 대화는 `saveCurrent`에 따라 저장하거나 지운다. 없거나 남의 것 404 · 🔒 |
| `DELETE /characters/:id/chat/saved/:campaignId` | 저장한 대화 지우기 | **204** · 🔒 |
| `GET /characters/:id/chat/memories` | 이 대화에서 캐릭터가 기억하는 것(최신 순) | **200** `{ character, started, memories: [{ id, content, createdAt }] }` · 🔒 |
| `DELETE /characters/:id/chat/memories/:memoryId` | 기억 지우기 | **204** · 내 대화의 기억만. 없으면 404 · 🔒 |
| `POST /characters/:id/chat/memories/refresh` | 지금 정리하기(아직 정리 안 된 대화를 바로 기억으로) | **200** `{ created }` · 🔒. 평소에는 대화가 3번 오갈 때마다 답을 돌려준 뒤 뒤에서 자동 정리한다 |
| `GET /characters/:id/chat/state` | 캐릭터 내 상태설정 조회 | **200** `{ character: { id, name, addressing }, state: { relationshipValue, relationshipNote, userNickname, autoRelationship, relationshipLabel } }` · 대화 전이면 기본값(0) · 🔒 |
| `PATCH /characters/:id/chat/state` | 상태설정 저장 `{ relationshipValue?(0~100 정수), relationshipNote?(~200자), userNickname?(~20자), autoRelationship?(true/false) }` | **200** · 보낸 필드만 바꾸고 빈 문자열은 지우기. 대화가 없으면 만든다. 범위·형식 오류 400 · 🔒. 친밀도는 구간 이름(처음 만난 사이~각별한 사이)과 메모를 근거로 모델에 넘기고, 호칭은 카드 호칭 규칙보다 우선한다(말투 높낮이는 카드대로) |
| `GET /characters/:id/chat/story` | 지금 대화의 이야기 상태 | **200** `{ started, brief, openHooks: [{ id, text }], closedEvents: [문장], auto, relation: { value, label, reason, log: [{ at, delta, value, reason }] } }` · 지난 이야기 요약·열린 복선·끝난 일·친밀도 자동 변화 기록(최근 10개) · 🔒 |
| `DELETE /characters/:id/chat/story/hooks/:hookId` | 잘못 잡힌 복선 지우기 | **204** · 없으면 404 · 🔒 |
| `GET /me/extras` | 내 엑스트라 목록 | **200** `[{ id, name, summary, personality, relation, situation, place, updatedAt }]` · 🔒 |
| `POST /me/extras` | 엑스트라 만들기 `{ name(~20, 필수), summary(~60, 필수), personality?(~200), relation?(~120), situation?(~200), place?(~120) }` | **201** · 1인당 20개(넘으면 409), 형식·글자 수 400 · 🔒 |
| `PATCH /me/extras/:extraId` | 엑스트라 고치기 (같은 본문) | **200** · 칸을 비우면 대화들에 적용해 둔 그 조건만 빠진다(조건이 다 빠지면 적용 해제) · 🔒 |
| `DELETE /me/extras/:extraId` | 엑스트라 지우기 | **204** · 모든 대화(저장한 대화 포함)에서 빠진다 · 🔒 |
| `GET /characters/:id/chat/extras` | 지금 대화의 엑스트라 설정 | **200** `{ limits, mine: [{ ...엑스트라, keywords: { relation, situation, place } }], applied: [{ extraId, triggers }] }` · `keywords`는 조건별로 등장을 부르는 단어(서버가 뽑음, 인물 관계에서는 주인공 이름 제외) · 🔒 |
| `PUT /characters/:id/chat/extras/:extraId` | 지금 대화에 적용·조건 바꾸기 `{ triggers: ["relation" \| "situation" \| "place", ...] }` (셋 다 = 모두) | **200** 위 설정 · 조건 0개·빈 칸 조건 400, 한 대화 3명(넘으면 409). 대화가 없으면 만든다 · 🔒 |
| `DELETE /characters/:id/chat/extras/:extraId` | 지금 대화에서 빼기 | **200** 위 설정 · 🔒 |
| `GET /me/conversations` | 대화 목록(최근 대화 순, 캐릭터마다 한 줄) | **200** `[{ id, character, messageCount, updatedAt, lastMessage, active, savedCount }]` · 지금 대화가 있으면 그것, 없으면 가장 최근에 저장한 대화. `active: false`면 지금 대화 없음 · 운영자가 내린 캐릭터와의 대화는 빠진다 · 🔒 |
| `POST /characters/:id/chat/suggestions` | 대답 추천 `{ personaId, avoid? }` (대화 기록은 서버 저장본) | **200** `{ suggestions: [3개] }` · 🔒 · `personaId` 필수 · `avoid`(최근 12개)에 넣은 추천과 겹치지 않게 새로 만든다("초기화") |
| `POST /agent-chat/messages` | 에이전트(코디컴퍼챗 안내 챗봇) `{ message(~2000자), history?(최근 20턴) }` | **200** `{ reply }` · 비로그인 가능 · LLM 요청 한도 초과 429 |

🔒 = `Authorization: Bearer <token>` 필요, 없거나 무효하면 401. 토큰은 HS256 JWT(7일, `AUTH_SECRET`로 서명)이고 비밀번호는 scrypt로 저장한다. 응답에 `passwordHash`는 절대 넣지 않는다. 웹은 토큰을 httpOnly 쿠키(`session`)에 넣고 서버에서만 Nest로 전달한다 — 브라우저 JS는 토큰을 볼 수 없다.

**요청 한도(429):** 아래 요청은 횟수를 제한하며, 넘으면 **429**와 `Retry-After`(초) 헤더, "…N초 뒤에 다시 시도해 주세요" 메시지를 돌려준다. 카운터는 서버 메모리의 고정 창이다.

| 대상 | 한도 | 기준 |
|------|------|------|
| `POST /auth/login` | 15분에 같은 이메일 10번, 한 IP에서 40번 | 이메일+IP, IP |
| `POST /auth/signup` | 1시간에 10번 | IP |
| `POST /auth/me/password` | 15분에 5번 | 사용자 |
| `POST /auth/me/verify-email` | 15분에 3번 | 사용자 |
| `POST /auth/password/forgot` | 15분에 같은 이메일 3번, 한 IP에서 10번 | 이메일+IP, IP |
| `POST /auth/verify-email`, `POST /auth/password/reset` | 15분에 20번 | IP |
| `POST /characters/:id/chat` (대화 전송) | 1분에 20번 | 사용자 |
| `POST /characters/:id/chat/suggestions` (대답 추천) | 1분에 10번 | 사용자 |
| 공방 `test/chat`·`test/critique`·`samples`·`draft-field` (LLM 호출) | 1분에 12번 | 사용자 |
| `POST /characters/:id/chat/memories/refresh` | 1분에 5번 | 사용자 |
| `PUT /studio/characters/:id/portrait` (업로드) | 1분에 10번 | 사용자 |
| `POST /characters/:id/report` (신고) | 1시간에 10번 | 사용자 |
| `POST /agent-chat/messages` | 1분에 15번 | IP |

- IP 기준은 웹 서버가 넘긴 `X-Forwarded-For`의 실제 이용자 IP로 센다. API는 **루프백·사설 주소에서 온 요청의 이 헤더만** 믿는다(`trust proxy`). 운영에서는 웹 앞단이 이 헤더를 덮어써야 이용자가 IP를 꾸며 한도를 피하지 못한다.
- `RATE_LIMIT=off`로 끄거나 `RATE_LIMIT_SCALE=<배수>`로 한도를 늘릴 수 있다(웹 자동 테스트가 쓴다). 기본은 켜짐.
- 서버가 여러 대가 되면 메모리 카운터 대신 공유 저장소(Redis 등)가 필요하다.

**보안 헤더:** 모든 API 응답에 `X-Content-Type-Options: nosniff`·`X-Frame-Options: DENY`·`Referrer-Policy: no-referrer`가 붙고 `X-Powered-By`는 없다. 웹 응답에는 nosniff·`X-Frame-Options: DENY`·`frame-ancestors 'none'`·`Referrer-Policy: strict-origin-when-cross-origin`·`Permissions-Policy`(카메라·마이크·위치·결제 끔)가 붙는다. **비밀번호:** 8자 이상 128자 이하이며, 흔한 값(`12345678`·`password` 등)·같은 글자 반복·이메일 아이디와 같은 값은 400.
| `GET /characters` | 발행된 공식 캐릭터 목록 | 501 |
| `POST /campaigns` | 캠페인 시작 | 501 |
| `GET /campaigns/:id` | 상태 포함 캠페인 조회 | 501 |
| `POST /campaigns/:id/sessions` | 세션 열기 | 501 |
| `POST /campaigns/:id/messages` | 유저 메시지 전송 + 스트림 응답 | 501 (컨텍스트 조립 + FastAPI `/infer` 중계 자리) |
| `POST /campaigns/:id/sessions/:sessionId/close` | 세션 종료·요약 트리거 | 501 (`/summarize` 결과를 CampaignState에 머지하는 자리) |
| `GET /campaigns/:id/logbook` | 회차 목록 | 501 |
| `GET /studio/characters` | 내 공방 초안 목록 | **200** `[{ id, name, oneLiner, published, visibility, hasPortrait, characterId, updatedAt, complete }]` · 🔒 |
| `POST /studio/characters` | 빈 초안 만들기 | **201** `{ id }` · 🔒 (로그인한 누구나) |
| `GET /studio/characters/:id` | 초안 열기 | **200** `{ id, plan, limitMultiplier, card, test: { turns, turnsUsed, turnsTotal, verdict, passed, stale }, characterId, published, visibility, hasPortrait, takedown: { at, reason } \| null, updatedAt, readiness }` · 내 초안만(남의 것 404) · 🔒 |
| `PATCH /studio/characters/:id` | 초안 저장 `{ card }` (카드 7층 전체를 통째로) | **200** 저장 결과 · 빈칸은 허용, 형식·글자 수 상한 위반은 어느 칸인지 알려 주며 400 · **글자 수 상한은 요금 등급을 따른다**: 프로(`PRO`)는 이름·호칭을 뺀 긴 글 칸(외형 서술·성격 요약·캠페인 역할 6칸·비밀·해금 조건·관계가 깨지는 것·첫 메시지·대체 인사·로어)이 3배, 무료는 1배. 이미 저장된 긴 글은 그대로이면 상한을 넘어도 통과해, 프로가 끝난 뒤에도 다른 칸을 저장할 수 있다(그 칸을 키우면 무료 상한으로 400) · 🔒 |
| `DELETE /studio/characters/:id` | 초안 지우기 | **204** · 발행된 캐릭터의 초안은 409 · 🔒 |
| `POST /studio/characters/:id/test/chat` | 3턴 테스트 한 턴 `{ message, personaId? }` | **200** `{ reply, turnsUsed, turnsTotal }` · 발행 뒤 실제 대화와 같은 경로(카드 → 공개 필드 + 페르소나 지식 → 검색 → 조립)로 답한다. 대화는 서버가 카드 지문과 함께 들고 있고, 카드를 고치면 새 테스트가 된다. 4턴째 409, 이름·말투·첫 메시지가 비면 400 · 🔒 |
| `POST /studio/characters/:id/test/critique` | 3턴 판정 | **200** `{ passed, toneBroken, overExplaining, metaLeak, inventedFacts, secretLeak, notes, at }` · 3턴 전이거나 카드를 고친 뒤면 409. 비밀 누설은 Nest가 비밀 원문과 비교해 판정한다(모델은 비밀을 모름) · 🔒 |
| `POST /studio/characters/:id/draft-field` | "이 칸만 AI로 초안" `{ field }` (예: `campaign.scene`, `personality.habits`) | **200** `{ field, kind: "text" \| "list", value: 문자열 \| 문자열[] }` · 제안만 돌려주고 **카드는 바뀌지 않는다**. 지원 칸: 한 줄 소개·태그, 외형 서술·키워드, 호칭 규칙·말투 습관·금지 말투·성격 요약, 캠페인 역할 6칸, 절대 하지 않는 것·관계가 깨지는 것, 첫 메시지·대체 인사, 로어 3칸. **비밀·해금 조건·이름·예시 대화·추가 로어는 400**(비밀은 AI에 보내지 않는다, §7.8). 결과는 칸의 글자 수·항목 수 상한에 맞춰 다듬는다 · 🔒 |
| `PUT /studio/characters/:id/portrait` | 흉상 초상 올리기 — **본문은 이미지 원본**, `Content-Type: image/webp\|jpeg\|png` | **200** 초안 · 150KB 이하(넘으면 400, 300KB 넘으면 413), 파일 첫 바이트가 선언한 형식과 맞아야 한다(그림인 척하는 파일은 400), gif·svg 등은 400. 카드와 따로라 다시 테스트할 필요 없다. **자동 검수**(FastAPI `/moderate-image`)를 거친다: 문제 없으면 `portraitReview: APPROVED`(발행 중이면 캐릭터에 바로 적용), 애매하거나 검수를 못 하면 `PENDING`(운영자 승인 전까지 캐릭터에는 초상 없음, 이유는 `portraitReviewNote`), 성적 노출·잔혹한 유혈 등은 **400**(저장 안 함) · 🔒 |
| `GET /admin/portraits` | 운영자: 검수 대기 초상 목록 | **200** `[{ draftId, name, note, updatedAt, published, owner, ownerEmail }]` · 운영자 아니면 403 · 🔒 |
| `GET /admin/portraits/:draftId/image` | 운영자: 검수 대기 그림 | **200** 이미지(`private, no-store`) · 🔒 |
| `POST /admin/portraits/:draftId` | 운영자: 승인·반려 `{ decision: "approve" \| "reject", note }` | **204** · 반려는 사유 필수(400, 만든 사람에게 보인다). 승인하면 발행된 캐릭터에 초상이 실린다. 대기 중이 아니면 404 · 🔒 |
| `DELETE /studio/characters/:id/portrait` | 초상 지우기 | **200** 초안 · 발행 중이면 캐릭터에서도 지운다 · 🔒 |
| `GET /studio/characters/:id/portrait` | 내 초안의 초상 미리보기 | **200** 이미지(`private, no-store`) · 없으면 404, 남의 초안은 404 · 🔒 |
| `POST /studio/characters/:id/samples` | 말투 샘플 답 2개 (성격·말투 단계) | **200** `{ question: "지금 뭐 해?", replies: [2개] }` · 3턴 테스트와 같은 경로(카드 → 페르소나 지식 → 검색 → 조립 → 개인사 가드)로 답하지만 **아무것도 저장하지 않는다**(테스트 턴을 쓰지 않고 테스트 상태에 영향 없음). 이름·반말/존댓말이 비면 400. 첫 메시지는 없어도 된다 · 🔒 |
| `POST /studio/characters/:id/test/reset` | 테스트 다시 시작 | **204** · 🔒 |
| `POST /studio/characters/:id/publish` | 발행 | **200** 초안(`published: true`, `characterId`, `visibility`) · **초안 주인 누구나**(2026-10-15 사용자 결정, 이전에는 운영자만). 필수 단계가 비었거나 지금 카드로 3턴 테스트를 통과하지 않았으면 409, 다른 캐릭터가 같은 이름이면 409(이름은 비공개 캐릭터를 포함해 전체에서 하나). 카드 → 캐릭터(비밀·해금 조건 포함, 서버 전용)로 만들거나 고치고, 초안의 공개 범위와 만든 사람(`ownerId`)을 싣는다. 페르소나 지식 파일 `data/personas/studio-<초안 id>.json`(비밀 제외)을 써서 첫 대화부터 RAG가 붙는다. 다시 발행하면 같은 캐릭터를 고친다(기존 대화 유지) · 운영자가 내린 캐릭터는 409(복구되기 전에는 다시 발행할 수 없다) · 🔒 |
| `POST /studio/characters/:id/unpublish` | 내리기 | **200** · 초안 주인. 목록·새 대화에서 빠지고 지식 파일을 지운다. 대화 기록과 초안은 남아 고쳐서 다시 발행할 수 있다 · 🔒 |
| `PATCH /studio/characters/:id/visibility` | 공개 범위 `{ visibility: "PUBLIC" \| "UNLISTED" \| "PRIVATE" }` | **200** 초안 · 공개 = 홈·인기 목록, 링크 공개 = 목록에 없고 주소(`/characters/:id`)를 아는 사람만, 비공개 = 만든 사람만. 새 초안 기본은 비공개. 카드 지문과 무관해 다시 테스트할 필요 없고, 발행 중이면 캐릭터에 바로 적용 · 잘못된 값 400 · 🔒 |

> 501을 쓰는 이유: 뼈대 단계에서 가짜 데이터를 돌려주면 프론트가 그걸 진짜로 착각한 채 배선된다. 미구현은 시끄럽게 실패하는 편이 낫다. 기획서 §10 4번의 "가짜 스트림"은 세션 채팅 셸을 만들 때 의도적으로 도입한다.

## FastAPI — Nest만 내부에서 호출 (웹은 알 필요 없음)

| 메서드/경로 | 용도 | 현재 |
|-------------|------|------|
| `GET /health` | 헬스체크 | **200** `{ status, service, timestamp, ai }` — `ai`는 AI 호출 대기열 상태(`inFlight`, `waitingForeground`, `waitingBackground`, `concurrency`) |
| `POST /infer` | 입력은 이미 조립된 컨텍스트 + 유저 턴 | **200** `{ reply }` (로컬 Ollama, 스트림은 아직) · `context.extras`(이번 턴 등장 조건에 맞은 엑스트라, 최대 3)가 있으면 시스템 프롬프트에 `<extras>` 블록(적힌 것만 사실, 목록 밖 새 인물 금지)과 맨 끝 "이번 답에서 엑스트라" 지시(이름 언급·관계 → 이름 넣어 소개, 상황·장소 → 장면에 등장, 방금 등장 → 이어 가기)를 붙인다 · **개인사 가드:** `context.ungroundedTopics`(Nest가 "유저가 개인사 주제를 물었는데 설정에 근거가 없다"고 판정한 주제)가 있으면 프롬프트 맨 끝에 단정 금지 지시를 붙인다. `retryNote`가 있으면 그 이유로 다시 쓴다 |
| `POST /ground-check` | 답의 개인사 단정 검사 `{ reply, topics, facts }` | **200** `{ invented, note }` · 설정 자료(`facts`)에 없는 나이·취미·가족·반려동물 등을 구체적으로 말했거나 있다/없다 단정했으면 `invented: true`. 말을 돌리거나 되묻기·설정에 적힌 말은 false. Nest가 근거 없는 개인사를 물은 턴에서만 부르고, 단정이면 최대 2번 다시 쓰게 한다(그래도 단정하면 안전한 말로 대체). 검사가 실패하면 원래 답을 쓴다 |
| `POST /moderate-image` | 초상 그림 검수 `{ image(base64), mime }` | **200** `{ verdict: "ok" \| "review" \| "block", flags, reason }` · 로컬 모델(gemma4, 그림 인식)이 항목별(성적 노출·미성년자·잔혹·혐오·자해·실존 인물 사진)로 판정하고 규칙이 결과를 정한다. 성적 노출·미성년자·잔혹 → block, 나머지 항목·확신 60 미만·판정 형식 깨짐 → review |
| `POST /draft-field` | 카드 칸 하나의 초안 `{ sheet, label, guide, kind, maxChars, maxItems, current }` | **200** `{ text, items }` · 카드 구조를 모르고 지금까지 채워진 설정 줄(비밀 제외)과 이 칸이 무엇인지만 받는다. 유저 글은 설정 자료일 뿐 지시로 따르지 않는다 |
| `POST /suggest-replies` | 컨텍스트 + `avoid` → 유저(주인공)가 다음에 할 말 3개. 매번 태도를 무작위로 섞는다 | **200** `{ suggestions }` · 계획서 §13.2 밖 신규 경로 |
| `POST /remember` | 대화 턴 + 기존 기억 → 캐릭터가 다음에도 기억할 짧은 문장 0~3개(사실·약속·관계 변화만, 잡담 제외, 기존과 중복 제외) | **200** `{ memories }` · 계획서 §13.2 밖 신규 경로(§13.4 `/summarize`는 세션 종료 요약용으로 따로 둔다) |
| `POST /assist` | 에이전트 페이지 안내 챗봇. 코디컴퍼챗 사용법·대화 요령으로 범위를 좁힌 시스템 프롬프트 | **200** `{ reply }` · 계획서 §13.2 밖 신규 경로 |
| `POST /summarize` | 대화 조각 요약·상태 갱신 `{ context, sessionTurns }` (기획서 13.4장) | **200** `{ brief, relationDelta: [{ axis: "친밀도", delta(-8~+8), reason }], hooksOpen: [{ text }], hooksClosed: [{ id }], knowledgeGained: [], unlocks: [], nextPressure }` · `context.storySoFar`(이전 요약)에 이번 대화를 합쳐 새 요약을 쓴다. 근거는 유저의 행동과 두 사람 사이에 일어난 일, 확실하지 않으면 변화 0. 형식이 깨지면 상태를 바꾸지 않는다 |
| `POST /critique-test` | 공방 3턴 테스트 판정 `{ character, turns, facts }` | **200** · 규칙 검사(메타 낱말, 420자 넘는 답·목록 3줄, 높임 어긋남)와 LLM 판정(말투 붕괴, 설명충, 메타, 설정에 없는 개인사 단정)을 합친다. 둘 중 하나라도 걸리면 걸린 것 |
| `POST /train` | 학습 시작 | **403 — v1 정책 차단** |
| `GET /train/{job_id}` | 학습 진행률 | **403 — v1 정책 차단** |

요청/응답 스키마는 `services/ai/app/schemas/`에 Pydantic 모델로 정의되어 있고, `http://localhost:8000/docs`에서 실제 형태를 볼 수 있다. 미구현이라도 **본문 검증은 작동한다** — 잘못된 본문은 501이 아니라 422와 함께 어느 필드가 틀렸는지 알려준다.

**필드명은 camelCase다.** 프론트 폼·Nest DTO·FastAPI 입력이 같은 뼈대를 공유해야 하고(기획서 §7.5) TypeScript 쪽이 camelCase이기 때문이다. 파이썬 내부는 snake_case를 쓰되 두 형태 모두 입력으로 받는다.

> `/train`의 403은 501과 의미가 다르다. 미구현이 아니라 **의도적으로 닫아 둔 것**이다 — v1은 자체 가중치 학습을 하지 않고 경로만 설계에 남긴다 (기획서 §7.6, §7.7). 구현하려다 만 것으로 오해하지 말 것.

## `/summarize` 반환 형태 (계획서 §13.4)

자유 산문 요약만 받지 않는다. 최소한 아래 필드를 구조화해서 돌려준다:

- `brief` — 다음 회차 브리핑용 3~5문장 (시스템용, 캐릭터 시점 아님)
- `relationDelta` — 어떤 관계 축이 왜 변했는지
- `hooksOpen` / `hooksClosed`
- `knowledgeGained` — 캐릭터가 새로 알게 된 것
- `unlocks` — 이번 세션에서 조건이 충족된 비밀 ID
- `nextPressure` — 디렉터가 다음 회차에 쓸 압력 한 줄

Nest는 이 객체를 `CampaignState`에 머지한다.

## 하지 말 것

- 웹(Next.js)에서 `/infer`, `/summarize` 등 FastAPI 엔드포인트를 직접 호출 (계획서 §7.1, §13 위반)
- `/train`을 v1에서 외부에 여는 것

## 이메일 인증·비밀번호 찾기

- 메일 링크의 토큰은 원문을 메일에만 싣고 DB(`email_tokens`)에는 SHA-256 해시만 둔다. 한 번 쓰면 끝이고, 새로 보내면 전에 보낸 링크는 무효다.
- 인증 링크는 열기만 해서는 인증되지 않고 화면의 버튼을 눌러야 한다(메일 보안 검사기가 링크를 미리 열어도 안전하게).
- 캐릭터 **발행**은 이메일을 인증한 계정만 할 수 있다(403). 도입 전에 가입한 계정은 인증된 것으로 옮겼다.
- 로그인 토큰에는 계정의 토큰 세대(`users.sessionVersion`)가 실린다. 비밀번호를 바꾸거나 재설정하면 세대가 올라 이전 토큰이 모두 401이 된다.
- 메일 발송 설정(`apps/api/.env`): `MAIL_SMTP_URL`(실제 발송), `MAIL_FROM`, `WEB_BASE_URL`(링크 주소). SMTP가 없으면 개발 중에는 서버 로그에 링크가 찍히고, `MAIL_OUTBOX_DIR`를 주면 그 폴더에 JSON으로 남는다(e2e가 쓴다).

## 결제 (요금 등급)

| 메서드·경로 | 설명 | 응답 |
|---|---|---|
| `GET /billing/products` | 상품표와 지금 켜진 결제 방식 | **200** `{ products: [{ id, name, amount, days }], provider: "toss" \| "mock" \| null, clientKey }` · 로그인 불필요. `provider: null`이면 결제를 열지 않는다 |
| `POST /billing/checkout` | 주문 만들기 `{ productId }` | **201** `{ orderId, orderName, amount, provider, clientKey, customerKey, customerEmail, customerName }` · 금액은 서버 상품표가 정한다. 없는 상품 400, 결제 미설정 503 · 🔒 |
| `POST /billing/confirm` | 결제창이 돌려준 결제 승인 `{ orderId, paymentKey, amount }` | **200** `{ paid: true, productId, amount, days, planUntil }` · 금액이 주문과 다르면 400(주문은 FAILED), 남의 주문 404, 실패한 주문 409. **같은 주문을 다시 승인해도 기간은 한 번만 늘어난다** · 🔒 |
| `GET /billing/orders` | 내 결제 내역(최근 50건)과 프로 만료 시각 | **200** `{ orders: [{ id, name, amount, days, paidAt }], planUntil }` · 🔒 |
| `GET /admin/users?email=` | 운영자: 계정 찾기 | **200** `{ email, displayName, role, plan, effectivePlan, planUntil, createdAt, orders }` · 403·404 · 🔒 |
| `POST /admin/users/plan` | 운영자: 등급 직접 변경 `{ email, plan: "PRO" \| "FREE", days? }` | **200** · days 없으면 만료 없는 프로. 환불·보상·시험 계정용(결제 기록은 바뀌지 않음) · 🔒 |

- 결제 방식(`apps/api/.env`): `BILLING_PROVIDER=toss` + `TOSS_SECRET_KEY`(서버 승인용, 절대 웹에 보내지 않음)·`TOSS_CLIENT_KEY`(웹 결제창용). 개발 중 설정이 없으면 돈이 오가지 않는 **가짜 결제(mock)**, 운영(`NODE_ENV=production`)에서는 아무것도 없으면 결제를 열지 않는다.
- 흐름: 웹 `/pricing` → `checkout`(주문) → 결제창(토스 SDK v2 `requestPayment`, 가짜면 `/billing/mock`) → `/billing/success?paymentKey&orderId&amount` → `confirm` → 서버가 결제사에 승인 요청(토스 `POST /v1/payments/confirm`, `Idempotency-Key`=주문 번호) → 승인 금액까지 맞으면 PAID + 프로 기간 연장.
- 기간: 남은 프로 기간이 있으면 그 뒤에 붙고, 만료 없는 프로는 그대로, 아니면 지금부터. 자동 결제(정기 결제)는 없다.
- 금액(프로 30일 4,900원, 1년 49,000원)은 **운영 전 확정이 필요한 임시값**이다(`apps/api/src/billing/products.ts`). 환불은 고객센터 → 운영자가 결제사 관리 화면에서 취소하고 `/admin/users`에서 등급을 되돌린다.
- 요청 한도: `checkout`·`confirm` 10분에 20번(사용자).
