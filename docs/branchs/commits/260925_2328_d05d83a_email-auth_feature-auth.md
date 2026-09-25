# 이메일 로그인과 회원 전용 페이지, 로그인 여부별 설정 추가

| 항목 | 내용 |
|------|------|
| Subject | `feat(auth): 이메일 로그인과 회원 전용 페이지, 로그인 여부별 설정 추가` |
| Full SHA | `d05d83a1fad2f00d5c0383b8bce41460d8e83be0` |
| Short SHA | `d05d83a` |
| Branch | `feature/auth` |
| Parent | `dd3b080` (develop) |
| Date | 2026-09-25T23:28:09+09:00 |

## 주 내용

- Nest `/auth/signup`·`/auth/login`·`/auth/logout`·`GET·PATCH /auth/me`·`POST /auth/me/password`, `AuthGuard`
- `users.passwordHash`(nullable) 마이그레이션, `jose` 의존성 추가
- 웹 로그인·회원가입 화면, `proxy.ts`, `requireUser()`, 드로어 잠금 표시와 로그인/로그아웃
- 설정: 모두에게 화면 테마, 로그인 시 표시 이름·비밀번호·로그아웃
- 비밀번호·토큰 헬퍼 단위 테스트 7개

## 상세

**배경**
사용자가 대화 목록·제작·마이페이지를 로그인 유저 전용으로, 설정을 비로그인/회원으로 나누길 원했다. 인증 벤더가 기획서 §15 열린 항목이라 로그인 API가 501로 남아 있던 상태였다.

**변경 범위**
apps/api(auth, prisma), apps/web(인증 화면·proxy·설정·드로어·레이아웃·테마), 문서(API, IA, CURRENT_STACK)

**기술 포인트**
토큰은 httpOnly 쿠키에만 두고 서버에서 Nest로 Bearer로 넘긴다(브라우저 JS가 볼 수 없음). 없는 이메일 로그인도 해시 비교를 해 응답 시간으로 가입 여부가 드러나지 않게 했다. 오류 뒤 React 19가 폼을 비우는 문제 때문에 비밀번호를 뺀 입력값을 돌려줘 다시 채운다. `next`는 사이트 안 경로만 허용한다.

**안 한 것**
로그인 시도 횟수 제한(무차별 대입 방어), 이메일 인증, 비밀번호 찾기, 회원 탈퇴, 소셜 로그인. 헤더(홈·인기·에이전트)는 확정 IA라 바꾸지 않았다. 기존 e2e 테스트(`/characters` 501 기대)는 고치지 않았다.

## 결과

**동작 확인**
API: 가입·중복 409·짧은 비번 400·틀린 비번 401·토큰 위조/`alg:none`/서명 변조 401. 브라우저(Chrome) 21개 시나리오 통과: 잠금 메뉴, 가입 후 원래 페이지 복귀, httpOnly 쿠키, 이름·비번 변경, 로그아웃 후 차단, 위조 쿠키 차단, 오픈 리다이렉트 차단. 단위 테스트 7개 통과.

**리스크**
로그인 시도 횟수 제한이 없어 외부 공개 전에 필요하다. `AUTH_SECRET`이 없으면 api가 시작하지 않으므로 각자 `.env`에 만들어야 한다.

**후속**
로그인 시도 제한, 비밀번호 재설정, e2e 테스트 갱신

**관련 문서**
[docs/API_DOCUMENTATION.md](../../API_DOCUMENTATION.md), [docs/plan/NAVIGATION_IA.md](../../plan/NAVIGATION_IA.md)
