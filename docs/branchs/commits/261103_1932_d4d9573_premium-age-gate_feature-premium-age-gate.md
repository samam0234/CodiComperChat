# 프리미엄 모델을 만 18세 이상으로 제한

| 항목 | 내용 |
|------|------|
| Subject | `feat(models): 프리미엄 모델을 만 18세 이상으로 제한` |
| Full SHA | `d4d9573a6bde5606ab18b9b8bfadf5da214f2a49` |
| Short SHA | `d4d9573` |
| Branch | `feature/premium-age-gate` |
| Parent | `c7d45ab` |
| Date | 2026-11-03 19:32:23 +0900 |

## 주 내용

- 프리미엄 모델(Claude·Grok)을 만 18세 미만과 생년월일을 넣지 않은 계정에는 잠갔다
- 설정에 나이 확인을 넣었다. 성인 확인과 별개라 `ADULT_MODE=off`여도 쓸 수 있다

## 상세

**배경**
사용자 결정(2026-11-03): 일단 막는다. Anthropic 사용 정책이 18세 미만 제공에 추가 지침을 요구한다.

**변경 범위**
`apps/api/src/models/`, `apps/api/src/account/`, `auth.service.ts`, 설정 화면, 대화 화면, 약관, 처리방침, 문서, e2e.

**기술 포인트**
`lockOf`가 공급자 다음, 코레딧 앞에서 나이를 본다. `POST /auth/me/birthdate`는 `birthDate`가 비어 있을 때만 저장해 한 번만 넣을 수 있다. 성인 모드는 끈 상태에서 생년월일을 받지 않으므로, 입구를 따로 두었다. 응답에는 `birthDateSet`만 싣고 날짜는 싣지 않는다.

**안 한 것**
본인인증. 생년월일은 자기 신고라 거짓 입력을 막지 못한다.

## 결과

**동작 확인**
단위 시험, API·웹 타입 검사. e2e 시나리오를 추가했고 전체 실행 결과는 별도 기록한다.

**리스크**
잘못 입력하면 사용자가 고칠 수 없다. 운영자가 DB에서 고쳐야 한다. 약관·처리방침 문구는 법률 검토 전이다.

**후속**
공개 전 법률 검토.

**관련 문서**
[API_DOCUMENTATION.md](../../API_DOCUMENTATION.md)
