# apps/web

코디컴퍼챗 이용자 사이트. Next.js 16 (App Router, React 19, TypeScript, CSS Modules).

```bash
# 저장소 루트에서
npm install
npm run dev:web     # http://localhost:3000  (API가 http://localhost:4000 에 켜져 있어야 한다)
npm run build:web
```

## 무엇이 있나

화면 31개. 홈·인기·캐릭터 상세, **대화**(기억·지난 이야기·상태설정·엑스트라·모델 고르기·명령어·글 꾸미기), **오퍼레이션**(심리 탐구·일기·메시지·커뮤니티·웹툰), **코디포토넷**·**비밀 퀘스트**·**성인 확인** 열림 상자, 캐릭터 **공방**(8단계), 대화 목록, 마이페이지·설정(테마·성인 확인), 로그인·가입·이메일 인증·비밀번호 찾기, 요금·결제(보류), 약관.

- **Nest만 부른다** — 데이터 읽기는 `lib/*.ts`(서버 전용), 쓰기는 `app/actions/*.ts`(서버 액션). 브라우저는 Nest 주소도 토큰도 모른다(토큰은 httpOnly 쿠키).
- `app/api/`는 그림 중계(초상·코디포토넷·웹툰 컷)와 CSP 보고 받기뿐이다. 무거운 추론을 넣지 않는다.
- **엄격한 CSP**: `proxy.ts`가 요청마다 새 nonce를 만든다. 외부 스크립트·이미지·프레임을 붙이면 거기에 출처를 더해야 한다.
- 글은 HTML로 넣지 않는다. `lib/chat-format.ts`가 표기를 읽고 `components/chat-text.tsx`가 React 요소로만 그린다.
- 디자인 토큰은 `app/globals.css`(라이트·다크, 한국 시각 자동 전환). 색·그림자·둥글기는 토큰만 쓴다.

## 문서

- 라우트·내비게이션 구조: [../../docs/plan/NAVIGATION_IA.md](../../docs/plan/NAVIGATION_IA.md)
- 폴더 구조: [../../docs/plan/PROJECT_STRUCTURE.md](../../docs/plan/PROJECT_STRUCTURE.md)
- 디자인: [../../docs/plan/DESIGN.md](../../docs/plan/DESIGN.md) · 화면 가이드: [../../docs/guidance/web-frontend.md](../../docs/guidance/web-frontend.md)
- 실행 가이드: [../../docs/guidance/getting-started.md](../../docs/guidance/getting-started.md)
- 보안: [../../SECURITY.md](../../SECURITY.md)

`AGENTS.md`와 `CLAUDE.md`는 `next dev`가 자동 생성·갱신한다. 손으로 고치지 않는다.
