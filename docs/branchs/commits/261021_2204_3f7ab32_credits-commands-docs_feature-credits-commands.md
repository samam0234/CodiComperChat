# 코레딧·모델 값·대화 명령어를 문서에 반영

| 항목 | 내용 |
|------|------|
| Subject | `docs(credits): 코레딧·모델 값·대화 명령어를 문서에 반영` |
| Full SHA | `3f7ab3264d76787abfc8f5d0482090ba09edc01d` |
| Short SHA | `3f7ab32` |
| Branch | `feature/credits-commands` |
| Parent | `7785348` (feature/credits-commands) |
| Date | 2026-10-21T22:04:29+09:00 |

## 주 내용

- AI_MODEL_STRATEGY에 코레딧 규칙과 모델별 값·원가 근거 표
- API 문서에 /me/credits·/me/attendance·chat/regenerate·continue·undo, /models·채팅 응답의 코레딧 필드
- DATABASE에 credit_ledger·attendances, 환경변수 MODEL_PREMIUM_FAKE, NAVIGATION_IA에 명령어·코레딧 카드

## 상세

**배경**
바로 앞 커밋(대화 명령어·코레딧)을 문서에 반영했다.

**변경 범위**
docs/

**기술 포인트**
- 원본 기획서는 건드리지 않음

**안 한 것**
없음

## 결과

**동작 확인**
- 문서에 남은 PRO_ONLY·"프로 등급만" 표현이 없는지 grep 확인

**리스크**
없음

**후속**
없음

**관련 문서**
이 커밋
