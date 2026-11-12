# 스튜디오와 세계관 폴더 나눔을 main에 합치다

| 항목 | 내용 |
|------|------|
| Subject | `merge(api): 스튜디오와 세계관 폴더 나눔을 main에 합치다` |
| Full SHA | `62018f79daf38c47a83c15ac91716c91c776330a` |
| Short SHA | `62018f7` |
| Branch | `main` |
| Parent | `fda3871, fb943f5` |
| Date | 2026-11-12 16:03:50 +0900 |

## 주 내용

`develop`을 `main`에 `--no-ff`로 합쳤다. 스튜디오와 세계관의 기능 폴더 나눔이 main에 들어간다.

## 상세

### 배경

develop에 합친 폴더 나눔을 공개 브랜치인 main에도 같은 방식으로 합류시킨다.

### 변경 범위

- develop 병합과 그 안의 기능 커밋
- 스튜디오 여섯 폴더, 세계관 다섯 폴더

### 기술 포인트

- main은 `D:/vscode/CodiComperChat-portfolio-refresh` 작업 트리에서 합친다. 기본 저장소에서 main을 체크아웃하지 않는다.

### 안 한 것

- 서버 재배포. 경로만 바뀌므로 주소는 같다.

## 결과

### 동작 확인

- develop에서 확인한 스튜디오·세계관 시험을 그대로 가져온다.

### 리스크

- 공개 API 이미지가 이 커밋으로 다시 만들어지기 전에는 배포 서버의 폴더 배치는 예전 그대로다. 동작 경로는 소스 안 상대 경로라 이미지에 포함되어야 반영된다.

### 후속 작업

- develop을 main에 맞춘 뒤 `develop`과 `main`을 함께 푸시한다.

### 관련 문서

- `apps/api/src/studio`
- `apps/api/src/worlds`
