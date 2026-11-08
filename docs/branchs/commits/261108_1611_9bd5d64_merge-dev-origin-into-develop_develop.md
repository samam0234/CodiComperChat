# feature/dev-origin-lan into develop (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/dev-origin-lan into develop (no-ff)` |
| Full SHA | `9bd5d6454ddef2a8ded80ae1ac3969890626e472` |
| Short SHA | `9bd5d64` |
| Branch | `develop` |
| Parent | `6f7b534, f9108d6` |
| Date | 2026-11-08 16:11:01 +0900 |

## 주 내용

개발 서버가 같은 망의 다른 사설 주소도 받게 한 변경을 develop에 병합했다.

## 상세

### 배경

허용 목록에 192.168.45.220이 빠져 있었다.

### 변경 범위

- `apps/web/next.config.ts`의 `allowedDevOrigins`.

### 안 한 것

운영 배포 설정은 바꾸지 않았다.

## 결과

### 동작 확인

설정 한 줄이다. 화면은 다시 누르지 않았다.

### 관련 문서

- apps/web/next.config.ts
