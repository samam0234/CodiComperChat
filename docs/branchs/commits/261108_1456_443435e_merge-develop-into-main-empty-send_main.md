# develop into main (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: develop into main (no-ff)` |
| Full SHA | `443435eaf6edf0eeecd6d932db5f4e1f4da72df0` |
| Short SHA | `443435e` |
| Branch | `main` |
| Parent | `f3e31cf, 9215421` |
| Date | 2026-11-08 14:56:30 +0900 |

## 주 내용

develop을 main에 --no-ff로 합쳤다. 빈칸 보내기와 강화 모델 설명이 main에 들어간다.

## 상세

### 배경

사용자가 develop과 main까지 병합한 뒤 푸시하라고 했다.

### 변경 범위

- 병합 커밋 하나. 내용은 develop과 같다.

### 기술 포인트

fast-forward는 쓰지 않았다.

### 안 한 것

로컬 개발 주소 허용 목록은 넣지 않았다. 운영 서버 이미지는 다시 올리지 않았다.

## 결과

### 동작 확인

병합 전에 로컬 1:1과 월드에서 빈칸 보내기를 확인했다.

### 리스크

main 푸시가 웹 배포를 일으킬 수 있다. API 이미지는 이 변경을 아직 포함하지 않는다.

### 후속

origin develop과 origin main을 푸시한다.

### 관련 문서

- docs/branchs/commits/261108_1451_ebcb752_merge-empty-send-into-develop_develop.md
