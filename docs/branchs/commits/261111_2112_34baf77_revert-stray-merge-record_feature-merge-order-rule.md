# 잘못 남긴 병합 기록 c4425bb를 되돌리다

| 항목 | 내용 |
|------|------|
| Subject | `docs(branchs): 잘못 남긴 병합 기록 c4425bb를 되돌리다` |
| Full SHA | `34baf7703845652d4583bdb9390bf8af40c1602f` |
| Short SHA | `34baf77` |
| Branch | `feature/merge-order-rule` |
| Parent | `c4425bb` |
| Date | 2026-11-11 21:12:41 +0900 |

## 주 내용

다른 세션의 커밋을 가리키던 틀린 병합 기록(c4425bb)을 되돌렸다.

## 상세

### 배경

`feature/hosted-config-fallback`은 다른 세션이 병합한 `feature/chatbot-speed`에 이미 들어 있었다. 병합할 것이 없었는데 병합 기록 스크립트를 돌려, 다른 세션의 커밋 8cf3d5c를 가리키는 기록 파일과 목록 줄이 생겼다.

### 변경 범위

- 그 기록 파일(`261111_2049_8cf3d5c_merge-hosted-config-fallback-into-develop_develop.md`)과 `docs/branchs/README.md` 목록 한 줄을 `git revert`로 되돌렸다.

### 기술 포인트

`reset --hard`가 차단돼 되돌리는 커밋으로 처리했다. 이력은 지우지 않았다.

### 안 한 것

푸시 전이라 원격에는 올라간 적이 없다.

## 결과

### 동작 확인

되돌린 뒤 기록 파일이 없고 목록에서 줄이 빠졌다.

### 리스크

없음.

### 후속

병합 전에 다른 세션이 움직였는지 확인하는 절차를 규칙에 넣었다.

### 관련 문서

- `docs/guidance/branch-merge.md`
