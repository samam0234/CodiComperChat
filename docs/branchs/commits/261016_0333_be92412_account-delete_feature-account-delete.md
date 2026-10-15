# 회원 탈퇴 추가, 탈퇴한 계정의 캐릭터가 공식으로 보이던 문제 막음

| 항목 | 내용 |
|------|------|
| Subject | `feat(auth): 회원 탈퇴 추가, 탈퇴한 계정의 캐릭터가 공식으로 보이던 문제 막음` |
| Full SHA | `be92412e516988e42915f8186bc4579c003667ba` |
| Short SHA | `be92412` |
| Branch | `feature/account-delete` |
| Parent | `df5fae2` (feature/ci-verify) |
| Date | 2026-10-16T03:33:11+09:00 |

## 주 내용

- `DELETE /auth/me` { password, confirm: "탈퇴합니다" } — `src/account`(신규): 비밀번호를 다시 확인하고 계정과 대화·기억·프로필·엑스트라·캐릭터 초안·신고를 삭제
- 탈퇴 전에 발행한 캐릭터를 모두 내리고 지식 파일 삭제(`StudioPublishService.retireAllOf`)
- 결제 기록 보존: `payment_orders.userId`를 비울 수 있게(SetNull) 하고 `buyerEmail` 저장(기존 주문도 마이그레이션으로 채움)
- 설정 화면 "회원 탈퇴" 칸, 탈퇴 후 홈 안내

## 상세

**배경**
사용자 요청("확인하지 못했거나 할 수 없는 것을 진행")의 약관 보강 중, 개인정보처리방침에 "회원 탈퇴 기능은 아직 준비 중"으로 적혀 있는 것을 확인했다.

**변경 범위**
apps/api(account 신규, studio-publish, billing, prisma, app.module), apps/web(설정, 홈, actions), e2e/tests/account.spec.ts, docs

**기술 포인트**
- 구현 중 발견한 실제 버그: 캐릭터의 `ownerId`는 계정이 지워지면 비워지는데(SetNull), 화면은 "ownerId 없음 = 운영 공식 캐릭터"로 판단한다. 그대로 지우면 탈퇴한 사람의 캐릭터가 "공식" 배지를 달고 계속 공개됐다. 지우기 전에 모두 내린다.
- 결제 주문이 계정과 함께 지워지던(Cascade) 것을 바꿨다 — 전자상거래법상 대금 결제 기록은 정해진 기간 보관해야 한다. 계정 연결만 끊고 구매자 이메일을 남기며, 탈퇴한 계정의 결제를 환불하면 되돌릴 기간 없이 환불만 한다.
- 되돌릴 수 없는 일이라 비밀번호와 확인 문구를 함께 받고, 요청 한도(password 규칙)를 건다.

**안 한 것**
탈퇴 유예 기간(바로 삭제한다), 운영자의 강제 탈퇴

## 결과

**동작 확인**
- e2e: 틀린 비밀번호 401, 확인 문구 없음 400, 화면에서 탈퇴 → 홈 안내, 로그인·옛 토큰 401, 발행 캐릭터 상세 404·목록에서 사라짐, 결제 주문은 userId 없음·buyerEmail·PAID로 남음, users에서 삭제. 결제 e2e와 함께 6개 통과
- 타입 검사 통과. 이 커밋 직후 API 단위 테스트에서 1개가 실패했다(162개 중) — 탈퇴와 무관한 간헐 실패로, 원인(비밀번호 규칙 시험의 모듈 불러오기 시간 초과, DB 한도의 Retry-After 61초)을 찾아 fix/test-load-stability에서 고쳤다(d8bd0aa, 9283d28)

**리스크**
탈퇴하면 그 사람의 캐릭터와 대화한 다른 이용자의 대화도 더는 열 수 없다(캐릭터가 내려가므로).

**후속**
탈퇴 유예 기간 검토

**관련 문서**
[docs/API_DOCUMENTATION.md](../../API_DOCUMENTATION.md)
