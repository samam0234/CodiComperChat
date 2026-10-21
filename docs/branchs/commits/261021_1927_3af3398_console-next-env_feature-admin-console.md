# next-env.d.ts를 저장소에서 빼기

| 항목 | 내용 |
|------|------|
| Subject | `chore(console): next-env.d.ts를 저장소에서 빼기` |
| Full SHA | `3af339892271069abdae5930407948a0c0a09a08` |
| Short SHA | `3af3398` |
| Branch | `feature/admin-console` |
| Parent | `bf9e5a8` (feature/admin-console) |
| Date | 2026-10-21T19:27:16+09:00 |

## 주 내용

- `console/next-env.d.ts`를 추적에서 빼고 .gitignore에 추가

## 상세

**배경**
콘솔 앱 커밋에 next가 만드는 next-env.d.ts가 들어갔다. 웹은 이미 무시하고 있어 맞췄다.

**변경 범위**
.gitignore, console/next-env.d.ts

**기술 포인트**
- 파일은 로컬에 남는다(git rm --cached)

**안 한 것**
없음

## 결과

**동작 확인**
- git check-ignore로 무시 확인

**리스크**
없음

**후속**
문서

**관련 문서**
없음
