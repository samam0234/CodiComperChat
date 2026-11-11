# develop into main (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: develop into main (no-ff)` |
| Full SHA | `85add9a337eaf3390888a20e07cbb032b6b36dcc` |
| Short SHA | `85add9a` |
| Branch | `main` |
| Parent | `9cc8bae, 6808591` |
| Date | 2026-11-11 21:14:53 +0900 |

## 주 내용

병합·푸시 순서 규칙과 인수인계 갱신, 틀린 병합 기록 되돌리기를 main에 병합했다.

## 상세

### 배경

병합과 푸시를 함께 시키면 main 병합 뒤에 develop·main을 같이 푸시해야 하는데 규칙에 순서가 없었다. 다른 세션이 병합한 브랜치를 모르고 병합 기록을 남긴 일도 있었다.

### 변경 범위

- develop(6808591)을 `--no-ff`로 main에 합쳤다.
- 되돌리기 34baf77, 규칙·인수인계 ecfdaaf와 각각의 기록.
- 같은 날 앞선 속도 고침(feature/chat-latency)과 호스팅 키 오류 고침(feature/hosted-config-fallback)은 다른 세션의 `feature/chatbot-speed` 병합으로 이미 develop에 들어가 있다.

### 기술 포인트

병합 전에 `git fetch`와 `merge-base --is-ancestor`로 다른 세션의 병합 여부를 본다.

### 안 한 것

서버에는 올리지 않았다.

## 결과

### 동작 확인

어댑터 시험 30개, mermaid 검사 통과(브랜치에서). 병합 뒤 전체 시험은 main 병합 후에 돌린다.

### 리스크

없음(문서).

### 후속

develop을 main에 맞춘 뒤 둘을 같이 푸시한다.

### 관련 문서

- `docs/guidance/branch-merge.md`
