# develop into main (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: develop into main (no-ff)` |
| Full SHA | `4e81abce1c3378e2275cf997eb111b62f08b40e4` |
| Short SHA | `4e81abc` |
| Branch | `main` |
| Parent | `d4a1e69, 020d975` |
| Date | 2026-11-08 16:11:17 +0900 |

## 주 내용

개발 서버가 같은 망의 다른 사설 주소도 받게 한 변경을 main에 병합했다.

## 상세

### 배경

develop 병합 9bd5d64와 그 기록을 main에 합쳤다.

### 변경 범위

- `apps/web/next.config.ts`의 `allowedDevOrigins`에 192.168.45.220.

### 안 한 것

운영 API는 다시 올리지 않았다. 이 설정은 개발 서버 전용이다.

## 결과

### 동작 확인

설정 한 줄이다. 화면은 다시 누르지 않았다.

### 관련 문서

- apps/web/next.config.ts
