# 전역 셸(헤더·드로어·푸터)과 라우트 뼈대 추가

| 항목 | 내용 |
|------|------|
| Subject | `feat(web): 전역 셸(헤더·드로어·푸터)과 라우트 뼈대 추가` |
| Full SHA | `884633c35e9669e7ba3de72699915fe966621797` |
| Short SHA | `884633c` |
| Branch | `feature/monorepo-scaffold` |
| Parent | `8d6db5d` |
| Date | 2026-09-15 04:55:55 +0900 |

## 주 내용

- npm workspaces 모노레포 시작 (루트 `package.json`, `workspaces: ["apps/*"]`)
- `apps/web` 생성: Next.js 16.3.5 / React 19.2.8 / App Router / TypeScript
- 헤더: 워드마크 `코디컴퍼챗` + 홈 / 인기 / 에이전트 + 우측 삼단 줄 버튼
- 드로어: 홈 / 대화 목록(라이브러리) / 제작 / 마이페이지 / 설정
- 푸터: 이용약관 | 개인정보처리방침 | 사업자 정보확인 | 고객센터
- 라우트 11개와 자리표시자 화면 추가
- 구현 반영으로 문서 6종 갱신 + `docs/plan/NAVIGATION_IA.md` 신규 작성

## 상세

**배경**
기획서 §10의 1번(모노레포)과 4번(Next 홈 셸)의 앞부분에 해당한다. 사용자가 지정한 헤더/드로어/푸터 구성을 먼저 뼈대로 세워, 이후 화면 작업이 붙을 자리를 만들었다.

**변경 범위**
- 루트: `package.json`, `package-lock.json`
- `apps/web/`: `app/`(layout + 11개 라우트 + globals.css), `components/`(site-header, site-drawer, site-footer, page-placeholder + 각 CSS Module), `next.config.ts`, `tsconfig.json`, `README.md`
- 문서: `docs/plan/NAVIGATION_IA.md`(신규), `CURRENT_STACK.md`, `PROJECT_STRUCTURE.md`, `Architecture/apps.md`, `guidance/getting-started.md`, `web_management/ports-inventory.md`, `docs/README.md`, `.agents/skills/codicomperchat/SKILL.md`

**기술 포인트**
- Next 16이 자동 생성하는 `apps/web/AGENTS.md`·`CLAUDE.md`의 경고("이 버전은 학습 데이터와 다르니 `node_modules/next/dist/docs/`를 먼저 읽을 것")에 따라 App Router 문서를 확인한 뒤 작성. `LayoutProps<"/">` 같은 타입 헬퍼는 `next typegen`/`next dev`/`next build` 시점에 생성되므로, 생성 전 `tsc --noEmit`은 실패하는 것이 정상이다.
- 스타일링은 Next 내장 CSS Modules만 사용 — Tailwind 등 외부 CSS 프레임워크를 도입하지 않아 스택 결정을 늘리지 않았다.
- `next/font/google`(Geist)를 제거하고 한국어 시스템 폰트 스택으로 교체. 빌드 시 폰트 다운로드 네트워크 의존이 사라지고, 한글 글리프가 폴백되지 않는다.
- 드로어는 열림 상태를 `data-open` 속성으로, 닫힘 상태를 React 19의 `inert`로 처리해 CSS 트랜지션을 유지하면서도 닫힌 메뉴가 포커스·스크린리더에 잡히지 않게 했다.
- 활성 메뉴 표시는 별도 클래스 대신 `aria-current="page"` 선택자로 스타일링.

**안 한 것**
- 세션(채팅) 화면, 캠페인 상태 패널 — 기획서 §10 4번 단계
- `apps/api`(Nest), `services/ai`(FastAPI), `docker-compose.yml` — 아직 미착수
- 인증, 데이터 연동 — 모든 화면이 정적 자리표시자
- 기획 원본(`CodiComperChat_project_plan.md`) 수정 — §0 원본 보존 원칙에 따라 손대지 않음

## 결과

**동작 확인**
- `npm run build:web` 성공, 라우트 11개 모두 static prerender
- `npm run dev:web` 기동 후 11개 경로 전부 200, 없는 경로는 404
- 홈 HTML에서 헤더·드로어·푸터 라벨 12종 렌더 확인, 닫힌 드로어에 `inert=""`, 햄버거에 `aria-expanded="false"` 확인
- **브라우저 육안 확인은 못 했다** (이 세션에 브라우저 도구 없음). 드로어 열림 애니메이션과 실제 레이아웃은 `http://localhost:3000`에서 사람이 확인해야 한다.

**리스크**
- 헤더 라벨 `에이전트`가 기획서 용어 체계(플랫폼=코디컴퍼챗, AI 기능=캠페니언)에 없는 신규 용어다. 정식 계획서 갱신 시 확정 필요 — `docs/plan/NAVIGATION_IA.md`에 기록해 둠.
- Node/npm 버전을 `engines`로 고정하지 않았다.

**후속**
- `feature/web-home-chat-shell`: 세션(채팅) 화면과 캠페인 상태 패널
- `feature/prisma-schema`, `feature/api-auth-crud`: 기획서 §10 2~3번

**관련 문서**
`docs/plan/NAVIGATION_IA.md`, `docs/plan/CURRENT_STACK.md`, `docs/plan/PROJECT_STRUCTURE.md`, `docs/guidance/getting-started.md`
