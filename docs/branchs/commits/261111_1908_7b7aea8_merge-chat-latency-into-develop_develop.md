# feature/chat-latency into develop (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/chat-latency into develop (no-ff)` |
| Full SHA | `7b7aea811acc35cdbf6f777ead7a876480020c67` |
| Short SHA | `7b7aea8` |
| Branch | `develop` |
| Parent | `2a4d0f3, fe3b71e` |
| Date | 2026-11-11 19:08:19 +0900 |

## 주 내용

배포 대화 속도 고침(호스팅 스트리밍·가벼운 예비·배경 예비 금지)과 빌드 타입 오류 고침을 develop에 병합했다.

## 상세

### 배경

배포 1:1 한 턴이 약 3분 53초였다. 호스팅 한 번에 받기 45초에 끊기면 긴 프롬프트가 CPU 예비로 넘어갔다.

### 변경 범위

- `feature/chat-latency`를 `--no-ff`로 develop에 합쳤다.
- fix(ai) 6626ad4, feat(api) fec5a9f, fix(web) 0d049d6, docs c9aa2ba.

### 기술 포인트

시간 제한은 조각 사이에 걸고, 첫 조각 전에 막힐 때만 가벼운 예비로 간다.

### 안 한 것

서버에 다시 올리지 않았다.

## 결과

### 동작 확인

API 타입 검사·린트·API 249·AI 단위 89·스크립트 36 통과. e2e 116 통과, 3 실패(이번 변경과 무관, `docs/find_debug/2026-11-11.md`).

### 리스크

서버에 올리기 전까지 배포 속도는 그대로다.

### 후속

TASKS U13.

### 관련 문서

- `docs/trainings/oracle-deploy-latency.md`
