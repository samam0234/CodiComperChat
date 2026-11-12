# 스튜디오와 세계관 폴더 나눔을 develop에 합치다

| 항목 | 내용 |
|------|------|
| Subject | `merge(api): 스튜디오와 세계관 폴더 나눔을 develop에 합치다` |
| Full SHA | `89a1b2a9a24ea08e8dc9e240657a77764a904499` |
| Short SHA | `89a1b2a` |
| Branch | `develop` |
| Parent | `fda3871, 700cb94` |
| Date | 2026-11-12 15:59:13 +0900 |

## 주 내용

`feature/studio-worlds-folders`를 `develop`에 `--no-ff`로 합쳤다. 스튜디오와 세계관의 기능 폴더 나눔이 develop에 들어간다.

## 상세

### 배경

이름만 겹치던 `studio/studio`, `worlds/worlds`를 하는 일마다 나눈 브랜치를 develop에 합류시킨다.

### 변경 범위

- 기능 커밋의 스튜디오 여섯 폴더, 세계관 다섯 폴더
- 그 커밋의 기록

### 기술 포인트

- 병합 커밋만 만든다. 내용을 다시 고치지 않는다.

### 안 한 것

- `main` 병합과 푸시. 이 기록 다음 단계에서 한다.

## 결과

### 동작 확인

- 기능 브랜치에서 스튜디오·세계관 시험을 통과한 뒤 합쳤다.

### 리스크

- 경로 변경이라 주소와 동작은 같다.

### 후속 작업

- 같은 내용을 `main`에 `--no-ff`로 합친 뒤 develop을 main에 맞추고 둘을 함께 푸시한다.

### 관련 문서

- `apps/api/src/studio`
- `apps/api/src/worlds`
