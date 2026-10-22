# 운영자 전용 콘솔 앱을 루트에 분리

| 항목 | 내용 |
|------|------|
| Subject | `feat(console): 운영자 전용 콘솔 앱을 루트에 분리` |
| Full SHA | `9bd36bdf7010e58f3ea42dd7b235ec7d605fae31` |
| Short SHA | `9bd36bd` |
| Branch | `feature/admin-console` |
| Parent | `329177b` (feature/admin-console) |
| Date | 2026-10-21T19:26:53+09:00 |

## 주 내용

- 저장소 루트에 운영자 전용 Next.js 앱 `console/` (포트 3001, 워크스페이스)
- 운영자만 로그인(`console_session`, httpOnly·SameSite=Strict·12시간), 모든 화면 `requireAdmin()`
- 대시보드·신고함·초상 검수·캐릭터 관리(신고 없이 내리기·복구)·계정 등급
- 이용자 사이트의 `/admin/*` 화면을 지우고 콘솔로 보냄, 마이페이지에 운영자만 "운영 콘솔 열기"
- e2e에 콘솔 서버(3102)·console.spec 5개, 신고·검수·등급 시험을 콘솔로 옮김, CI에 콘솔 린트·타입 검사

## 상세

**배경**
사용자 지시("root 구간에 운영자 전용 콘솔서버도 만들어. next.js로")에 따라 운영 화면을 이용자 사이트에서 떼어 냈다.

**변경 범위**
console/, apps/web/(admin 제거·리다이렉트·마이페이지 링크), e2e/, .github/workflows/ci.yml, scripts/ci-local.mjs, package.json

**기술 포인트**
- 콘솔도 Nest만 부른다(FastAPI 직접 호출 없음)
- proxy.ts에서 요청마다 nonce CSP(외부 출처 없음), X-Robots-Tag noindex
- 디자인 토큰은 웹과 같은 값

**안 한 것**
없음

## 결과

**동작 확인**
- 전체 e2e 52개 통과
- oxlint, 타입 검사 api·web·console 통과

**리스크**
운영에서 콘솔을 바깥에 열면 안 된다(DEPLOYMENT에 적음)

**후속**
문서

**관련 문서**
다음 커밋
