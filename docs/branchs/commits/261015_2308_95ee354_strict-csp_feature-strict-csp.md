# 요청마다 nonce를 쓰는 엄격한 CSP 적용

| 항목 | 내용 |
|------|------|
| Subject | `feat(web): 요청마다 nonce를 쓰는 엄격한 CSP 적용` |
| Full SHA | `95ee354797aab95131ec0f903873f0fd6d2e24b9` |
| Short SHA | `95ee354` |
| Branch | `feature/strict-csp` |
| Parent | `5ba4d25` (feature/ci) |
| Date | 2026-10-15T23:08:57+09:00 |

## 주 내용

- `apps/web/proxy.ts`: 화면 요청마다 nonce를 만들어 `Content-Security-Policy`를 응답과 요청 헤더에 붙임 (Next가 요청 헤더에서 nonce를 읽어 자기 스크립트에 붙인다)
- `script-src 'self' 'nonce-…' 'strict-dynamic' https://js.tosspayments.com` — `unsafe-inline` 없음
- `object-src 'none'`, `base-uri 'self'`, `form-action`·`frame-src`·`connect-src`는 자기 자신 + 토스페이먼츠, `frame-ancestors 'none'`
- 개발 서버만 HMR용 `unsafe-eval`·웹소켓 허용, 운영은 `upgrade-insecure-requests`
- next.config.ts의 고정 CSP(frame-ancestors만 있던 것)는 proxy로 옮김

## 상세

**배경**
사용자 요청("아직 안 된 것 중 배포 빼고 전부 진행"). 보안 헤더 작업 때 CSP는 `frame-ancestors`만 걸고, 스크립트 출처를 묶는 부분은 Next 인라인 스크립트와 맞춰야 해서 미뤄 두었다.

**변경 범위**
apps/web(proxy.ts, next.config.ts), e2e/tests/security.spec.ts, docs

**기술 포인트**
- nonce + `strict-dynamic`: nonce가 붙은 스크립트와 그 스크립트가 불러온 스크립트만 실행된다. 결제 버튼을 누를 때 우리 코드가 토스 SDK를 불러오므로 따로 허용 목록이 없어도 되지만, `strict-dynamic`을 모르는 옛 브라우저를 위해 주소도 적었다.
- nonce는 요청마다 달라야 하므로 모든 화면이 요청 때 그려져야 한다 — 루트 레이아웃이 이미 로그인 쿠키를 읽어 모든 화면이 동적 렌더링이라 그대로 맞는다(빌드 결과 전부 ƒ).
- 스타일은 인라인을 허용했다: React의 style 속성과 Next가 쓰는 인라인 스타일 때문이고, 스타일은 스크립트 실행 경로가 아니다.
- proxy 대상을 회원 전용 화면에서 모든 화면으로 넓혔다(정적 파일·이미지·API 라우트·미리 가져오기 제외). 로그인 확인은 예전처럼 회원 전용 경로에만 한다.

**안 한 것**
스타일까지 nonce로 묶기, CSP 위반 보고(report-to) 수집

## 결과

**동작 확인**
- e2e: nonce가 요청마다 다르고, `unsafe-inline` 없음, 페이지의 모든 `<script>`에 그 요청의 nonce / 로그인한 채 주요 화면 10곳(홈·인기·캐릭터 상세·라이브러리·공방·마이페이지·설정·요금·에이전트·약관)에서 CSP 위반 0건. 보안 e2e 7개 통과
- 운영 빌드(별도 폴더)를 띄워 8개 화면에서 CSP 위반·스크립트 오류 0건, 메뉴 열기(하이드레이션) 동작 확인
- web tsc 통과

**리스크**
새로 외부 스크립트·이미지·프레임을 붙이면 proxy.ts의 CSP에 출처를 더해야 한다(안 하면 브라우저가 막는다).

**후속**
CSP 위반 보고 수집

**관련 문서**
[docs/API_DOCUMENTATION.md](../../API_DOCUMENTATION.md)
