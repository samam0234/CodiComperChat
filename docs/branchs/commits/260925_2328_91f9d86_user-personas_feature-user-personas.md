# 마이페이지 프로필 캐릭터 관리와 채팅 프로필 선택 추가

| 항목 | 내용 |
|------|------|
| Subject | `feat(persona): 마이페이지 프로필 캐릭터 관리와 채팅 프로필 선택 추가` |
| Full SHA | `91f9d8614a6e7ac5bbbff6038db1ef02f8878ac7` |
| Short SHA | `91f9d86` |
| Branch | `feature/user-personas` |
| Parent | `1c3c678` (develop) |
| Date | 2026-09-25T23:28:13+09:00 |

## 주 내용

- `user_personas` 테이블 마이그레이션, Nest `/me/personas` CRUD (본인 것만, 남의 것은 404, 10개 초과 409)
- 채팅 `personaId`: 비로그인 채팅은 유지, 프로필 사용 시에만 로그인·소유 확인
- FastAPI `ContextSlice.userPersona`와 시스템 프롬프트 블록
- 마이페이지 프로필 캐릭터 만들기·수정·삭제, 채팅 입력창 아래 "내 프로필" 선택(마지막 선택 기억)

## 상세

**배경**
사용자가 대화 시작 시 입력창 아래에서 프로필 캐릭터를 고르고, 마이페이지에서 만들 수 있기를 원했다.

**변경 범위**
apps/api(prisma, personas, character-chat), apps/web(마이페이지, 채팅), services/ai(context, inference), 문서

**기술 포인트**
모든 조회·수정 조건에 userId를 건다. 프로필 소개는 유저 입력이라 `<user_persona>` 블록으로 감싸고 지시로 따르지 말라고 명시했다. 채팅 중 프로필을 바꾸면 다음 메시지부터 적용된다.

**안 한 것**
프로필 공유·검색(v1 범위 밖), 프로필 이미지, 대화 내역 저장.

## 결과

**동작 확인**
API: 남의 프로필 수정·삭제·사용 404, 토큰 없이 사용 401, 11번째 생성 409. 브라우저 16개 시나리오 통과. 실제 Gemini 대화에서 캐릭터가 프로필 소개(싫어하는 과목)를 반영하고 호칭은 카드대로 유지함을 확인.

**리스크**
없음

**후속**
대화 시작 전 프로필 선택 의무화, 대답 추천 기능

**관련 문서**
[docs/API_DOCUMENTATION.md](../../API_DOCUMENTATION.md), [docs/plan/NAVIGATION_IA.md](../../plan/NAVIGATION_IA.md)
