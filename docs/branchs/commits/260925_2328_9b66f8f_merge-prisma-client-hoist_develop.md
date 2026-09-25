# merge: fix/prisma-client-hoist into develop (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: fix/prisma-client-hoist into develop (no-ff)` |
| Full SHA | `9b66f8f49abe59d963c4fc7e47d18e810e90c286` |
| Short SHA | `9b66f8f` |
| Branch | `develop` |
| Parent | `53585b6`, `8834809` |
| Date | 2026-09-25T23:28:00+09:00 |

## 주 내용

- `fix/prisma-client-hoist`를 `develop`에 `--no-ff`로 병합
- Prisma 클라이언트 설치 배치 수정

## 상세

**배경**
Prisma 클라이언트 설치 배치 수정 작업을 마치고 develop에 합류.

**변경 범위**
루트 `package-lock.json`

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
