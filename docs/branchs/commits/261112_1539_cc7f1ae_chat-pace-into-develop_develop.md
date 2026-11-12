# 대화 속도와 Nest 묶음을 develop에 합치다

| 항목 | 내용 |
|------|------|
| Subject | `merge(api): 대화 속도와 Nest 묶음을 develop에 합치다` |
| Full SHA | `cc7f1ae226fee3539d15c1ad8e30e63b26bcb980` |
| Short SHA | `cc7f1ae` |
| Branch | `develop` |
| Parent | `de97acf, 4f9168d` |
| Date | 2026-11-12 15:39:25 +0900 |

## 주 내용

`feature/chat-pace-and-api-bundles`를 `develop`에 `--no-ff`로 합쳤다. 대화 출력 상한과 미리 읽기, Nest `src` 여덟 묶음이 develop에 들어간다.

## 상세

### 배경

공개 웹의 대기 시간을 줄이려고 만든 기능 브랜치를 develop에 합류시킨다. fast-forward는 쓰지 않는다.

### 변경 범위

- `8a342d0` 대화 답 상한, 추가 생성 제거, 화면을 열 때의 미리 읽기
- Nest `src`를 `core`, `account`, `chat`, `studio`, `worlds`, `play`, `trust`, `billing`으로 나눔
- 그 커밋의 기록 `4f9168d`

### 기술 포인트

- 병합 커밋만 만든다. 브랜치 내용을 다시 고치지 않는다.

### 안 한 것

- `main` 병합과 푸시. 이 기록 다음 단계에서 한다.
- Oracle 이미지 재배포.

## 결과

### 동작 확인

- 기능 브랜치에서 나레이션 16/16, 타입 검사와 단위 테스트를 확인한 뒤 합쳤다.

### 리스크

- develop에 합쳐도 공개 API 이미지는 바뀌지 않는다.

### 후속 작업

- 같은 내용을 `main`에 `--no-ff`로 합친 뒤 develop을 main에 맞추고 둘을 함께 푸시한다.

### 관련 문서

- `docs/trainings/chat-latency.md`
