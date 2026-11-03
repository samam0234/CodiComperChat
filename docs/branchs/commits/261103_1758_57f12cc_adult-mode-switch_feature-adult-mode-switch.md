# 성인 모드를 끄는 ADULT_MODE 스위치

| 항목 | 내용 |
|------|------|
| Subject | `feat(account): 성인 모드를 끄는 ADULT_MODE 스위치` |
| Full SHA | `57f12ccb12634276c29bad1f8ff9d953d1160947` |
| Short SHA | `57f12cc` |
| Branch | `feature/adult-mode-switch` |
| Parent | `5160930` |
| Date | 2026-11-03 17:58:10 +0900 |

## 주 내용

- 서비스 전체에서 성인 모드를 끄는 `ADULT_MODE=off`를 넣었다. 운영 compose의 기본값이다
- 권리자·보안 연락처 추천안을 인수인계에 적었다

## 상세

**배경**
법률 검토 전에는 성인 모드를 공개하지 않는다는 규칙이 문서에만 있었고, Hetzner 약관도 음란물 게시를 금지한다. 끈 채로 먼저 열 수 있어야 한다.

**변경 범위**
`apps/api/src/account/adult.ts`, `account.service.ts`, `adult-dialog.tsx`, 운영 compose, `.env.example`, 문서.

**기술 포인트**
모든 성인 판정이 `adultBlock` 하나를 지나므로 맨 앞에서 `DISABLED`를 돌려준다. 만들기·보기가 함께 막힌다. 꺼져 있을 때 성인 확인은 생년월일을 저장하기 전에 거절한다. 개발 환경의 기본은 켜짐이라 동작이 그대로다.

**안 한 것**
설정 화면의 성인 확인 칸 숨기기(제출하면 안내 문구가 나온다). 끈 상태의 브라우저 시험.

## 결과

**동작 확인**
API 201개, 타입 검사, oxlint 통과. 스위치는 단위 시험으로 봤고, 실제로 끈 서버에서 확인하지는 않았다.

**리스크**
운영에서 `on`으로 바꾸는 판단은 법률 검토 뒤 사용자가 한다.

**후속**
권리자 이름과 연락처는 사용자가 확정한다.

**관련 문서**
[THIRD_PARTY_NOTICES.md](../../../THIRD_PARTY_NOTICES.md)
