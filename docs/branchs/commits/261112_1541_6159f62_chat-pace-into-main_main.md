# 대화 속도와 Nest 묶음을 main에 합치다

| 항목 | 내용 |
|------|------|
| Subject | `merge(api): 대화 속도와 Nest 묶음을 main에 합치다` |
| Full SHA | `6159f624f297206dc73fcf66314d51f7d37d4f37` |
| Short SHA | `6159f62` |
| Branch | `main` |
| Parent | `de97acf, 9a3c658` |
| Date | 2026-11-12 15:41:44 +0900 |

## 주 내용

`develop`을 `main`에 `--no-ff`로 합쳤다. 대화 출력 상한과 미리 읽기, Nest `src` 여덟 묶음이 main에 들어간다.

## 상세

### 배경

develop에 합친 대화 속도 변경을 공개 브랜치인 main에도 같은 방식으로 합류시킨다.

### 변경 범위

- develop 병합 `cc7f1ae`와 그 안의 기능 커밋 `8a342d0`
- 대화 답 상한, 추가 생성 제거, 화면을 열 때의 미리 읽기
- Nest `src` 여덟 묶음

### 기술 포인트

- main은 `D:/vscode/CodiComperChat-portfolio-refresh` 작업 트리에서 합친다. 기본 저장소에서 main을 체크아웃하지 않는다.

### 안 한 것

- Oracle API 이미지 재배포. 푸시 뒤에 Vercel 웹이 먼저 갱신될 수 있다.
- 호스팅 API를 미리 호출하는 예열.

## 결과

### 동작 확인

- develop에서 확인한 나레이션 16/16과 단위 테스트를 그대로 가져온다.

### 리스크

- 공개 API 서버가 이 커밋으로 다시 만들어지기 전에는 출력 상한과 `/warm`이 배포 경로에 없다.

### 후속 작업

- develop을 main에 맞춘 뒤 `develop`과 `main`을 함께 푸시한다.

### 관련 문서

- `docs/trainings/chat-latency.md`
