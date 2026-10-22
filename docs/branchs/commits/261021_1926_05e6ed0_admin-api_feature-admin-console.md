# 운영 콘솔용 통계·캐릭터 전체 목록 API 추가

| 항목 | 내용 |
|------|------|
| Subject | `feat(api): 운영 콘솔용 통계·캐릭터 전체 목록 API 추가` |
| Full SHA | `05e6ed0ecec447bbc9acfd47988d1b79d62a0b92` |
| Short SHA | `05e6ed0` |
| Branch | `feature/admin-console` |
| Parent | `6eb4fb6` (feature/admin-console) |
| Date | 2026-10-21T19:26:34+09:00 |

## 주 내용

- `GET /admin/stats`: 콘솔 대시보드 숫자(이용자·캐릭터·신고·초상 검수·대화·AI 대기열)
- `GET /admin/characters`: 비공개·내려간 것까지 모든 캐릭터 찾기·상태 거르기
- `GET /admin/characters/:id/portrait`: 운영자 전용 초상(no-store, nosniff, CSP sandbox)

## 상세

**배경**
사용자 지시("root 구간에 운영자 전용 콘솔서버도 만들어. next.js로")에 따라 콘솔이 쓸 API를 먼저 만들었다.

**변경 범위**
apps/api/src/admin/, apps/api/src/app.module.ts

**기술 포인트**
- AuthGuard + AdminGuard(DB의 역할)로 막는다
- 캐릭터 목록 take는 1~200으로 자른다

**안 한 것**
없음

## 결과

**동작 확인**
- typecheck:api, test:api 162개 통과
- e2e console.spec(일반 계정 403) 통과

**리스크**
없음

**후속**
콘솔 앱

**관련 문서**
다음 커밋에서 API_DOCUMENTATION 갱신
