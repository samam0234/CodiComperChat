# 대사 수정·기억·때와 곳 경로를 적다

| 항목 | 내용 |
|------|------|
| Subject | `docs(chat): 대사 수정·기억·때와 곳 경로를 적다` |
| Full SHA | `99d19219910346b4bc334ed1f3652e8280a41dfa` |
| Short SHA | `99d1921` |
| Branch | `feature/chat-edit-memory` |
| Parent | `9de48eb` |
| Date | 2026-11-08 00:49:39 +0900 |

## 주 내용

- 대화 수정·방향 추천·직접 기억·때와 곳의 경로를 API 문서와 기능 목록에 적었다.
- AI 서비스 README에 `/notice-facts`와 `/rewrite-line`을 넣었다.
- 인수인계에 마이그레이션 35개와, 모델 평가를 다시 돌리지 않은 사실을 적었다.

## 상세

**배경**
기능이 코드에만 있으면 다음 작업이 운영 상태와 코드 상태를 헷갈린다.

**변경 범위**
`docs/API_DOCUMENTATION.md`, `docs/FEATURES.md`, `docs/AGENT_HANDOVER.md`, `services/ai/README.md`.

**기술 포인트**
기획 원본 `CodiComperChat_project_plan.md`는 수정하지 않았다.

**안 한 것**
화면 수 집계는 새로 세지 않았다. 운영 배포 절차는 바꾸지 않았다.

## 결과

**동작 확인**
문서만 고쳤다. 시험은 앞 커밋의 API 241개·AI 73개다.

**리스크**
운영 DB에 마이그레이션이 적용되기 전에는 문서의 새 경로가 실패한다.

**후속**
운영 API를 다시 띄울 때 `prisma migrate deploy`가 새 칸을 넣는지 본다.

**관련 문서**
`docs/AGENT_HANDOVER.md`
