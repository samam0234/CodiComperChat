# feature/seyeon-portrait into develop (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/seyeon-portrait into develop (no-ff)` |
| Full SHA | `9776681dbaa14ccef3c201b33c3583a094e0d5b3` |
| Short SHA | `9776681` |
| Branch | `develop` |
| Parent | `f29dc31, cde995f` |
| Date | 2026-11-11 22:51:59 +0900 |

## 주 내용

`feature/seyeon-portrait`(이세연 초상 교체)를 develop에 `--no-ff`로 병합했다.

## 상세

### 변경 범위

이세연 초상 파일 교체, 시드의 초상 맞춤, 인물 문서 한 줄.

### 안 한 것

서버·개발 DB 시드는 돌리지 않았다.

## 결과

### 동작 확인

시드 문법 검사 통과. 코드 시험은 다시 돌리지 않았다.

### 리스크

운영자가 바꾼 이세연 초상은 시드 때 덮인다.

### 후속

서버·개발 DB에서 `npx prisma db seed`.
