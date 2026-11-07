# 웹(Vercel) 배포와 API 연결 상태를 문서에 반영

| 항목 | 내용 |
|------|------|
| Subject | `docs(deploy): 웹(Vercel) 배포와 API 연결 상태를 문서에 반영` |
| Full SHA | `ab6ce4f10943341d4096dd849e30648a4e846829` |
| Short SHA | `ab6ce4f` |
| Branch | `feature/web-vercel-deploy` |
| Parent | `e82e91a` |
| Date | 2026-11-07 09:21:12 +0900 |

## 주 내용

- 웹(Vercel) 배포와 API 연결 상태를 `DEPLOYMENT.md`, `oracle-backend.md`에 적었다

## 상세

**배경**
웹은 다른 세션이 이미 Vercel에 올려 둔 상태였다. `API_BASE_URL`이 `api.` 접두사 없는 주소라 연결되지 않았고 `WEB_PROXY_TOKEN`도 없었다. 사용자가 웹도 올리라고 해서(2026-11-07) 환경변수를 고치고 `main`으로 다시 배포했다.

**변경 범위**
문서 2개. 환경변수 이름과 주의점만 적었고 값(토큰)은 적지 않았다.

**안 한 것**
운영 콘솔 연결(`API_BASE_URL`, 허용할 IP를 사용자가 정해야 함), Vercel 보호 설정 변경.

## 결과

**동작 확인**
`https://codicomperchat-web.vercel.app` 홈·인기 화면에 API의 캐릭터가 렌더링됨, 로그인·가입·요금제 화면 200, 런타임 오류 0. 로그인한 상태로 대화하는 전체 흐름은 시험하지 못했다.

**리스크**
프록시 토큰이 대화 기록에 한 번 남았다(필요하면 서버 `.env`와 Vercel 값을 함께 교체).

**후속**
병합과 푸시(사용자가 말할 때), 콘솔 연결, SMTP.
