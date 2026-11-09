# feature/chat-live-socket into develop (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/chat-live-socket into develop (no-ff)` |
| Full SHA | `8065f0ec307d36815de5f650403eb73ab0ee8e95` |
| Short SHA | `8065f0e` |
| Branch | `develop` |
| Parent | `3d3cc9c, 17530e6` |
| Date | 2026-11-09 19:08:38 +0900 |

## 주 내용

1:1 대화 답을 웹소켓으로 바로 보여 주는 변경을 develop에 병합했다.

## 상세

### 배경

로컬 모델이 토큰을 다 만들 때까지 화면이 비어 있었다. 소켓은 그 글을 옮길 뿐 추론을 빠르게 하지 않는다.

### 변경 범위

- `/infer/stream`, `/ws/chat`, 문서와 포트폴리오.

### 안 한 것

운영 서버는 다시 올리지 않았다. 푸시는 하지 않는다.

## 결과

### 동작 확인

스트림 단위 시험과 표 파서 시험을 통과했다. 브라우저에서 실제 모델 답은 다시 보지 않았다.

### 관련 문서

- docs/WORKFLOW.md
- CodiComperChat_project_plan.md
