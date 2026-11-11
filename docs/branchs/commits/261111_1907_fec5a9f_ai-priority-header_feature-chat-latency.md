# AI 요청에 우선순위 머리글을 붙이다

| 항목 | 내용 |
|------|------|
| Subject | `feat(api): AI 요청에 우선순위 머리글을 붙이다` |
| Full SHA | `fec5a9fc0a5bde95f7786b7813c3b2d994a289a5` |
| Short SHA | `fec5a9f` |
| Branch | `feature/chat-latency` |
| Parent | `53c6947` |
| Date | 2026-11-11 19:07:55 +0900 |

## 주 내용

Nest가 AI 서비스에 요청할 때 우선순위를 `X-AI-Priority` 머리글로 알린다.

## 상세

### 배경

AI 서비스는 배경 작업을 CPU 예비로 내리지 않아야 하는데, 어떤 요청이 배경인지는 Nest 큐만 알았다.

### 변경 범위

- `aiHeaders(json, priority)`가 늘 `X-AI-Priority`를 넣는다(기본 foreground).
- `send`와 `postToAi`가 큐에 넘기던 우선순위를 머리글로도 보낸다.
- 스트림·GET은 기본값 foreground.

### 기술 포인트

큐 순서(배경은 동시 자리 −1까지)는 그대로이고, 머리글은 AI 쪽 예비 판단에만 쓰인다.

### 안 한 것

큐 동작은 바꾸지 않았다.

## 결과

### 동작 확인

API 시험 249개 통과(새 시험: 기본 foreground, `{priority:'background'}`이면 background). 타입 검사 통과.

### 리스크

예전 AI 서비스는 이 머리글을 무시하므로 함께 올리지 않아도 깨지지 않는다.

### 후속

서버의 `api` 컨테이너를 다시 빌드한다.

### 관련 문서

- `docs/trainings/oracle-deploy-latency.md`
