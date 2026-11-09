# develop into main (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: develop into main (no-ff)` |
| Full SHA | `f157e3f60af0741ab84c47d99e0357db022ea5c7` |
| Short SHA | `f157e3f` |
| Branch | `main` |
| Parent | `4dac5f3, 3318f0e` |
| Date | 2026-11-09 19:09:02 +0900 |

## 주 내용

1:1 대화 답을 웹소켓으로 바로 보여 주는 변경을 main에 병합했다.

## 상세

### 배경

develop 병합 8065f0e와 그 기록을 main에 합친다.

### 변경 범위

- `/infer/stream`, `/ws/chat`, 기획서 0.1.4, 포트폴리오.

### 안 한 것

운영 서버는 다시 올리지 않았다. 푸시는 하지 않는다.

## 결과

### 동작 확인

스트림 단위 시험과 표 파서 시험을 통과했다. 브라우저에서 실제 모델 답은 다시 보지 않았다.

### 관련 문서

- docs/STATUS.md
- CodiComperChat_project_plan.md
