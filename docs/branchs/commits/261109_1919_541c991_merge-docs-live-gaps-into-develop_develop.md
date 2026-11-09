# feature/docs-live-socket-gaps into develop (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/docs-live-socket-gaps into develop (no-ff)` |
| Full SHA | `541c991a1d080e44f89ec11c202e86bcb8f760df` |
| Short SHA | `541c991` |
| Branch | `develop` |
| Parent | `3318f0e, 58b74d8` |
| Date | 2026-11-09 19:19:10 +0900 |

## 주 내용

웹소켓 이후 빠져 있던 문서 갱신을 develop에 병합했다.

## 상세

### 배경

README와 안내·구조 문서, 앱 README, 기획 시트가 답이 한 번에 온다고 남아 있었다.

### 변경 범위

- `feature/docs-live-socket-gaps`를 `--no-ff`로 develop에 합쳤다.

### 기술 포인트

1:1은 웹소켓으로 토큰을 보여 주고, 소켓은 추론을 나누지 않는다.

### 안 한 것

main 병합과 푸시는 이 기록 다음에 따로 한다. 공개 API는 다시 올리지 않았다.

## 결과

### 동작 확인

병합 충돌은 없었다.

### 리스크

공개 서버는 이 소켓을 아직 모른다.

### 후속

main에 `--no-ff`로 병합한다. 푸시는 하지 않는다.

### 관련 문서

- `README.md`
- `docs/STATUS.md`
