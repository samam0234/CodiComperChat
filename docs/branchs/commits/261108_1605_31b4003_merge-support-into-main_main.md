# develop into main (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: develop into main (no-ff)` |
| Full SHA | `31b400379e5ee7d57686924b972cfc604fa581c5` |
| Short SHA | `31b4003` |
| Branch | `main` |
| Parent | `119400f, 6f7b534` |
| Date | 2026-11-08 16:05:30 +0900 |

## 주 내용

고객센터 문의와 문서·포트폴리오 갱신을 main에 병합했다.

## 상세

### 배경

develop 병합 `f42f7d2`와 그 기록을 main에 합쳤다.

### 변경 범위

- 이용자 문의와 운영 콘솔 답변.
- 문서와 포트폴리오의 표 수·모델 구분·문의 화면.

### 안 한 것

운영 API 이미지는 다시 만들지 않았다. 공개 웹이 먼저 배포되면 문의 화면이 옛 API를 만난다.

## 결과

### 동작 확인

병합 전 로컬 API와 고객센터 화면에서 문의가 남는 것을 확인했다.

### 관련 문서

- docs/STATUS.md
- docs/web_management/oracle-backend.md
