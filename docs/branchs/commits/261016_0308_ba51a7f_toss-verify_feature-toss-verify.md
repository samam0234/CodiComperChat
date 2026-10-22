# 환불·영수증·가격 설정과 토스 키 확인 도구 추가

| 항목 | 내용 |
|------|------|
| Subject | `feat(billing): 환불·영수증·가격 설정과 토스 키 확인 도구 추가` |
| Full SHA | `ba51a7faab67c9fc5b0fbb8b848804fdc2dd7317` |
| Short SHA | `ba51a7f` |
| Branch | `feature/toss-verify` |
| Parent | `5337a56` (develop) |
| Date | 2026-10-16T03:08:49+09:00 |

## 주 내용

- 운영자 환불(`POST /admin/orders/:id/refund`, `/admin/users` 화면의 "환불"): 결제사 환불 성공 뒤에만 기록을 REFUNDED로 바꾸고 그 결제 일수만큼 프로 기간을 되돌림
- 토스 결제 취소 API(`POST /v1/payments/{paymentKey}/cancel`, `Idempotency-Key`) 연결
- 승인 응답의 영수증 주소(`receipt.url`, https만) 저장, 마이페이지 결제 내역에 영수증·환불됨 표시
- 상품 가격을 `BILLING_PRICE_PRO_30`·`BILLING_PRICE_PRO_365`로 설정 (0원·음수·소수·글자는 무시하고 기본값)
- `npm run billing:check --workspace api`: 시크릿 키·연결 확인 도구(없는 결제로 승인 요청, 돈은 오가지 않음, 키 값은 출력하지 않음)

## 상세

**배경**
사용자 요청("확인하지 못했거나 할 수 없는 것을 배포 제외하고 진행"). 토스 실결제를 상점 키 없이 확인하지 못했고, 가격은 코드에 박힌 임시값이었으며, 환불은 결제사 관리 화면에서 손으로 해야 했다.

**변경 범위**
apps/api(billing, prisma, scripts), apps/web(운영자 계정 화면, 마이페이지, 타입), e2e/tests/billing.spec.ts, docs, .env.example

**기술 포인트**
- 토스 공식 샘플 저장소(tosspayments/tosspayments-sample)를 받아 우리 연동과 비교: 결제창 SDK `https://js.tosspayments.com/v2/standard`, `TossPayments(clientKey).payment({ customerKey }).requestPayment({ method: "CARD", … })`, 승인 `POST /v1/payments/confirm` + Basic 인증 — 우리 코드와 같은 방식이다.
- 샘플의 문서용 테스트 시크릿 키로 실제 토스 승인 API를 호출: 없는 결제 키에 `NOT_FOUND_PAYMENT_SESSION`(키 인증·요청 형식 통과), 틀린 키에 `UNAUTHORIZED_KEY`. 키는 저장소에 넣지 않았다.
- 환불 순서: 결제사 환불이 먼저 성공해야 우리 기록을 바꾼다 — 돈은 돌려주지 않았는데 기간만 줄어드는 일을 막는다. 만료 없는 프로(운영자 부여)는 건드리지 않는다.
- 영수증 주소는 https로 시작할 때만 저장한다(결제사 응답을 그대로 링크로 내보내므로).

**안 한 것**
토스 결제창을 우리 사이트에서 열어 시험 결제를 끝까지 해 보기 — 문서용 테스트 키를 e2e 서버 설정에 넣는 변경이 자동 승인 규칙(자격 증명 취급)에 막혀 진행하지 않았다. 부분 환불, 정기 결제

## 결과

**동작 확인**
- 단위 테스트: 가격 설정 2개, 취소 요청 모양·거절·가짜 결제, 영수증 주소 (billing 10개 통과)
- e2e 환불: 일반 유저 403, 사유 없음 400, 운영자 화면에서 환불 → 기간 30일 줄어듦·REFUNDED 1건·등급 유지, 두 번 환불 409. 결제 e2e 5개 통과
- 토스 승인 API에 문서용 테스트 키로 실제 호출(위 기술 포인트)

**리스크**
부분 환불은 지원하지 않는다(전액만).

**후속**
상점 키로 결제창 끝까지 시험 결제

**관련 문서**
[docs/API_DOCUMENTATION.md](../../API_DOCUMENTATION.md)
