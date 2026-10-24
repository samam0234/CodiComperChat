# apps/api

코디컴퍼챗 도메인/상태 API. Nest.js 12 (TypeScript, ESM) + Prisma 7. 외부(웹·콘솔)에 공개되는 **유일한 백엔드**이고 **신뢰 경계**다 — 인증·권한·소유 확인·요청 한도·입력 검사를 모두 여기서 한다. DB 접근도 이 앱에만 있다.

```bash
# 저장소 루트에서
npm install
cp apps/api/.env.example apps/api/.env      # DATABASE_URL, AUTH_SECRET(32자 이상) 필수
(cd apps/api && npx prisma migrate deploy && npm run prisma:seed)
npm run dev:api        # http://localhost:4000
npm run typecheck:api  # 개발 서버가 켜져 있을 땐 build:api 말고 이것 (dist를 지워 서버가 죽는다)
npm run test:api       # vitest 185개 (DB·SMTP가 있으면 통합 시험 포함)
```

## 모듈 (`src/`)

| 모듈 | 하는 일 |
|------|---------|
| `auth` `account` | 가입·로그인·비밀번호·이메일 인증·재설정, 토큰 세대, 회원 탈퇴, **성인 확인**(`adult.ts`) |
| `characters` `character-chat` `conversations` | 캐릭터 목록·상세, 대화(컨텍스트 조립·새로하기·이어하기·대답 추천), 대화 기록 |
| `memories` `campaign-state` `chat-state` `extras` `personas` `persona-rag` | 기억, 지난 이야기(요약·친밀도·복선), 상태설정, 엑스트라, 내 프로필, 캐릭터 지식 검색 |
| `studio` | 공방: 초안·AI 초안·퀘스트 AI 제작·3턴 테스트·발행·초상·검수 |
| `quests` | 비밀 퀘스트: 진행·판정 반영·코레딧 보상 |
| `operations` | 오퍼레이션(심리 탐구·일기·메시지·커뮤니티), **코디포토넷**, **웹툰** |
| `credits` `models` `plan` `billing` | 코레딧(출석·차감·환불), 대화 모델 조건(강화 무료 하루 한도), 요금 등급, 결제(보류) |
| `reports` `admin` | 신고, 운영 콘솔용 통계·검수·관리 |
| `ai` `security` `mail` `agent-chat` `health` `prisma` | FastAPI 호출·대기열, 요청 한도, 메일, 안내 챗봇, 상태 확인, DB |
| `campaigns` | 계획서 §13.1 경로 자리(501). 실제 대화는 `character-chat` |

모듈은 `*.module.ts` + `*.controller.ts` + `*.service.ts`가 기본이고 계층은 Controller → Service → Prisma다(별도 Repository 없음). 입력 검증은 모듈마다 작은 파서 함수로 한다. 테이블 27개 — [../../docs/plan/DATABASE.md](../../docs/plan/DATABASE.md).

- 엔드포인트 목록: [../../docs/API_DOCUMENTATION.md](../../docs/API_DOCUMENTATION.md)
- 계층 규칙: [../../docs/Architecture/layers.md](../../docs/Architecture/layers.md) · 폴더 구조: [../../docs/plan/PROJECT_STRUCTURE.md](../../docs/plan/PROJECT_STRUCTURE.md)
- 환경변수: [../../docs/guidance/environment.md](../../docs/guidance/environment.md)
- 보안 장치와 공개 전 필수: [../../SECURITY.md](../../SECURITY.md)

## 도구

`apps/api/scripts/`(루트에서 `npm run <이름> --workspace api -- …`): `user:role`(운영자 지정) · `user:plan`(등급) · `persona:build`·`persona:search`(캐릭터 지식) · `billing:check`(토스 연결) · `mail:check`(메일). `prisma:seed`는 공식 캐릭터(유지성, 비밀 퀘스트 포함)를 맞춘다.

## 주의

- **ESM이다.** 상대 import에는 `.js` 확장자를 붙인다 (`./app.module.js`). TS 파일을 가리켜도 `.js`로 쓴다.
- 테스트는 Jest가 아니라 **vitest**, 린트는 ESLint가 아니라 **oxlint**다(CI는 `--deny-warnings`).
- FastAPI(`services/ai`)는 이 앱만 내부망에서 호출한다. 웹이 직접 호출하지 않는다 (기획서 §7.1). 그래서 FastAPI에는 인증이 없다.
- 비밀(`Character.secret`·해금 조건)과 비밀 퀘스트의 달성 조건은 공개 응답에도 AI에도 싣지 않는다.
