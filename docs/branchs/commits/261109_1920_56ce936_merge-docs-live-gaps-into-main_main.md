# develop into main (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: develop into main (no-ff)` |
| Full SHA | `56ce93624ff277b7c02e433ab28f52d53a0b20ab` |
| Short SHA | `56ce936` |
| Branch | `main` |
| Parent | `23b8c90, 2a4d0f3` |
| Date | 2026-11-09 19:20:47 +0900 |

## 주 내용

웹소켓 이후 빠져 있던 문서 갱신을 main에 병합했다.

## 상세

### 배경

README와 안내·구조 문서, 앱 README, 기획 시트가 답이 한 번에 온다고 남아 있었다.

### 변경 범위

- develop을 `--no-ff`로 main에 합쳤다.

### 기술 포인트

1:1은 웹소켓으로 토큰을 보여 주고, 소켓은 추론을 나누지 않는다.

### 안 한 것

푸시는 하지 않는다. 공개 API는 다시 올리지 않았다.

## 결과

### 동작 확인

병합 충돌은 없었다.

### 리스크

공개 서버는 이 소켓을 아직 모른다. main을 푸시하면 웹만 먼저 나갈 수 있다.

### 후속

푸시는 사용자가 말할 때만 한다.

### 관련 문서

- `README.md`
- `docs/STATUS.md`
