# merge: feature/auth into develop (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/auth into develop (no-ff)` |
| Full SHA | `4f091c958b8cbbc1d5ea529458dcf275e21a4935` |
| Short SHA | `4f091c9` |
| Branch | `develop` |
| Parent | `dd3b080`, `73965dd` |
| Date | 2026-09-25T23:28:09+09:00 |

## 주 내용

- `feature/auth`를 `develop`에 `--no-ff`로 병합
- 이메일 로그인과 회원 전용 페이지

## 상세

**배경**
이메일 로그인과 회원 전용 페이지 작업을 마치고 develop에 합류.

**변경 범위**
apps/api(auth, prisma), apps/web(인증 화면·proxy·설정·드로어·레이아웃·테마), 문서(API, IA, CURRENT_STACK)

**기술 포인트**
표준 병합 절차(`docs/guidance/branch-merge.md`)대로 `--no-ff` 사용.

**안 한 것**
없음

## 결과

**동작 확인**
`git merge --no-ff` 정상 완료, 충돌 없음

**리스크**
없음

**후속**
없음

**관련 문서**
[docs/guidance/branch-merge.md](../../guidance/branch-merge.md)
