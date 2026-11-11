# develop into main (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: develop into main (no-ff)` |
| Full SHA | `3ad90019a6859d6915157b7eb8e0886b23c0b102` |
| Short SHA | `3ad9001` |
| Branch | `main` |
| Parent | `1410bbd, 961d86b` |
| Date | 2026-11-11 23:06:15 +0900 |

## 주 내용

develop(이세연 초상 명찰 지우기 포함)을 main에 `--no-ff`로 병합했다. main이 열린 작업 폴더(`CodiComperChat-portfolio-refresh`)에서 병합했다.

## 결과

### 동작 확인

충돌 없음. 코드 변경이 없어 시험은 돌리지 않았다.

### 후속

서버·개발 DB에서 `npx prisma db seed`.
