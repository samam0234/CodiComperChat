# develop into main (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: develop into main (no-ff)` |
| Full SHA | `3517b743bd279f0ccc8de3e64692cc0406d07715` |
| Short SHA | `3517b74` |
| Branch | `main` |
| Parent | `f29dc31, 23a06f6` |
| Date | 2026-11-11 22:52:20 +0900 |

## 주 내용

develop(이세연 초상 교체 포함)을 main에 `--no-ff`로 병합했다.

## 상세

### 배경

main이 다른 작업 폴더(`CodiComperChat-portfolio-refresh`)에서 열려 있어 그 폴더(깨끗한 상태)에서 병합했다. 로컬 main은 origin/main보다 뒤처져 있어 먼저 fast-forward했다.

### 안 한 것

서버·개발 DB 시드는 돌리지 않았다.

## 결과

### 동작 확인

병합 충돌 없음. 코드 시험은 다시 돌리지 않았다.

### 후속

서버·개발 DB에서 `npx prisma db seed`.
