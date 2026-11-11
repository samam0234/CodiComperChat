# 대화 속도 원인과 고침, 서버에 올리는 법을 적다

| 항목 | 내용 |
|------|------|
| Subject | `docs(docs): 대화 속도 원인과 고침, 서버에 올리는 법을 적다` |
| Full SHA | `c9aa2ba6bf2ab7fb287bcc82bd3b91fc235a44ae` |
| Short SHA | `c9aa2ba` |
| Branch | `feature/chat-latency` |
| Parent | `211271b` |
| Date | 2026-11-11 19:07:57 +0900 |

## 주 내용

대화 속도 고침의 원인·변경·기대 값·재배포 절차를 문서로 남겼다.

## 상세

### 배경

서버 로그를 볼 수 없어 원인은 코드와 기록된 값으로 맞췄다. 그 사실과 확인하지 못한 것을 함께 적어야 한다.

### 변경 범위

- `docs/trainings/oracle-deploy-latency.md`: 2026-11-11 절(원인 순서도, 고친 것 표, 기대 값, 시험).
- `docs/find_debug/2026-11-11.md`: 판단 과정, 빌드 타입 오류, 남은 e2e 실패 3개. README 목록.
- `docs/web_management/oracle-backend.md`: `api ai` 다시 빌드하는 명령과 새 설정.
- `docs/TASKS.md`: U13(서버에 올리고 재기).

### 기술 포인트

기대 값은 근거(1회 실측)와 함께 적고, 실제로 잰 값이 아님을 밝혔다.

### 안 한 것

기획 원본은 고치지 않았다. STATUS는 서버에 올린 뒤 고친다.

## 결과

### 동작 확인

링크 대상 파일이 있는지 확인했다.

### 리스크

서버에 올리기 전까지 배포 동작은 예전 그대로다.

### 후속

U13 결과를 실측 문서에 적는다.

### 관련 문서

- `docs/trainings/oracle-deploy-latency.md`
- `docs/find_debug/2026-11-11.md`
