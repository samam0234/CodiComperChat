# 홈·인기에 공식 캐릭터 목록 렌더링

| 항목 | 내용 |
|------|------|
| Subject | `feat(web): 홈·인기에 공식 캐릭터 목록 렌더링` |
| Full SHA | `96c042e72f5fa687e065fdc3e251cf22707fc86a` |
| Short SHA | `96c042e` |
| Branch | `feature/character-list-web` |
| Parent | `c905ded` |
| Date | 2026-09-16 20:21:27 +0900 |

## 주 내용

- `apps/web/components/character-list.tsx` 신설 — Nest `GET /characters`를 호출하는 서버 컴포넌트
- 홈(`/`)의 "캐릭터 선택" 영역에 실제 목록 연결
- 인기(`/popular`)의 "인기 캐릭터" 영역에 실제 목록 연결
- 에이전트(`/agents`) 플레이스홀더 문구를 AI 챗봇 가이드·프롬프트 추천으로 정정
- `docs/plan/NAVIGATION_IA.md`에 페이지별 역할 표 추가

## 상세

**배경**
유지성 카드가 DB에 들어가고 `GET /characters`가 200을 돌려주는데도 사용자 눈에는 안 보였다. 웹이 API를 **한 번도 호출하지 않는 플레이스홀더 상태**였기 때문이다. 사용자가 "왜 안 보여?"라고 물어 이 구멍을 메웠다.

첫 시도에서 목록을 `/agents`에 붙였는데 이는 오독이었다. `docs/plan/NAVIGATION_IA.md`가 에이전트를 "캐릭터 탐색 진입점"이라 적어 두었고 `/agents` 페이지 본문도 "공식 캐릭터 목록"이라고 되어 있어 그대로 따랐으나, 사용자 정정에 따르면 **에이전트는 ChatGPT·Gemini 같은 AI 챗봇 가이드/프롬프트 추천 자리**이고 캐릭터는 **홈과 인기**에 놓인다. 목록을 옮기고 문서를 고쳤다.

**변경 범위**
- 신규: `apps/web/components/character-list.{tsx,module.css}`, `apps/web/app/page.module.css`, `apps/web/app/popular/page.module.css`
- 수정: `apps/web/app/page.tsx`, `apps/web/app/popular/page.tsx`, `apps/web/app/agents/page.tsx`, `docs/plan/NAVIGATION_IA.md`

**기술 포인트**
- **서버 컴포넌트에서 직접 fetch.** `"use client"` 없이 async 컴포넌트로 두어 브라우저에 API 주소를 노출하지 않는다. 그래서 `NEXT_PUBLIC_` 접두사 없는 `API_BASE_URL`을 쓰고, 없으면 `http://localhost:4000`으로 떨어진다.
- **`cache: "no-store"`.** seed를 다시 돌리거나 공방에서 캐릭터를 발행하면 즉시 반영되어야 한다. 기본 캐시를 두면 개발 중에 "왜 안 바뀌지"가 생긴다.
- **fetch 실패를 페이지 크래시로 만들지 않았다.** `apps/api`가 꺼져 있으면 서버 컴포넌트에서 예외가 터져 500이 난다. `try/catch`로 감싸 "apps/api가 켜져 있는지 확인하세요"를 띄운다 — 개발 중 가장 흔한 상태라서.
- **`CharacterList`를 공용 컴포넌트로 뺐다.** 홈·인기가 같은 목록을 쓰므로 fetch·타입·카드 마크업을 한 곳에 뒀다. `emptyMessage`만 페이지별로 다르게 받는다.
- 웹은 FastAPI를 직접 부르지 않는다 — `docs/guidance/api-usage.md`의 금지 항목을 지켜 Nest만 호출한다.

**안 한 것**
- **인기순 정렬** — `Character`에 플레이 횟수 같은 지표가 없다. 가짜 순위를 만드는 대신 발행 순으로 두고 "플레이 횟수 집계가 아직 없어 발행 순으로 보여 줍니다"를 화면에 적었다.
- **캐릭터 상세 페이지 / 카드 클릭** — 다음 브랜치.
- **에이전트 챗봇 UI** — 다음 브랜치. 이번엔 문구만 정정.
- `apps/web/.env.example` — `apps/web/.gitignore`가 `.env*`를 예외 없이 무시해 추적되지 않는다. 기본값이 코드에 있어 굳이 만들지 않았다.

## 결과

**동작 확인**
- `/` 200, "유지성" + "캐릭터 선택" 렌더링
- `/popular` 200, "유지성" + "인기 캐릭터" 렌더링
- `/agents` 200, 캐릭터 없음 / 챗봇 가이드 문구만
- `npx tsc --noEmit` 통과

**리스크**
- **`GET /characters`가 `secret`·`secretUnlockCondition`을 그대로 내려준다.** 지금 목록 카드는 그 필드를 그리지 않지만, 응답 본문에는 들어 있어 브라우저 개발자 도구가 아니라 **서버 컴포넌트 단계에서만** 소비되는 점이 유일한 방어다. 상세 페이지를 만들며 API에서 잘라야 한다.
- 헤더 라벨 `에이전트`는 기획서 어휘에 없는 신규 용어다. 계획서 갱신 때 정리가 필요하다(NAVIGATION_IA.md 용어 주의 참고).

**후속**
- `GET /characters/:id` + 비밀 필드 제외
- 캐릭터 상세 페이지 (설정 + 인트로), 카드 클릭 이동
- 에이전트 챗봇 UI

**관련 문서**
`docs/plan/NAVIGATION_IA.md`, `docs/guidance/api-usage.md`, `docs/plan/CHARACTERS.md`
