# 결제 없이 눌러서 프로로 바꾸기

| 항목 | 내용 |
|------|------|
| Subject | `feat(billing): 결제 없이 눌러서 프로로 바꾸기` |
| Full SHA | `5b5c5ae6fd007f3b28360b5d3e7ab9db5956373d` |
| Short SHA | `5b5c5ae` |
| Branch | `feature/pro-click` |
| Parent | `ea99e95` |
| Date | 2026-11-03 19:30:56 +0900 |

## 주 내용

- `/pricing`에서 결제 없이 눌러서 프로로 30일 바꾸는 버튼을 넣었다

## 상세

**배경**
사용자 결정(2026-11-03): 배포해도 아직 정식 서비스가 아니므로 실제 결제 대신 클릭으로 바꾼다.

**변경 범위**
`apps/api/src/billing/`(`pro-click.ts`, 서비스·컨트롤러), `apps/web/app/pricing/`, 운영 compose, `.env.example`, 문서, e2e.

**기술 포인트**
`POST /billing/pro-click`. 주문을 만들지 않는다. 프로 기간이 남아 있으면 409라 눌러서 쌓을 수 없다. 운영은 `PRO_CLICK=on`일 때만 열리고(compose 기본 on), 토스 결제가 켜지면 값과 상관없이 닫힌다.

**안 한 것**
프리미엄 모델 공급자를 열지 않았다. 토스 결제 코드는 그대로 둔다.

## 결과

**동작 확인**
단위 시험, API 타입 검사, 웹 타입 검사. e2e 시나리오를 추가했고 전체 실행 결과는 별도 기록한다.

**리스크**
프로는 출석 코레딧이 5배다. 프리미엄 공급자를 함께 열면 무료 코레딧으로 나가는 실제 지출도 늘 수 있다.

**후속**
정식 서비스 전에 `PRO_CLICK=off` 또는 토스 결제 전환.

**관련 문서**
[API_DOCUMENTATION.md](../../API_DOCUMENTATION.md)
