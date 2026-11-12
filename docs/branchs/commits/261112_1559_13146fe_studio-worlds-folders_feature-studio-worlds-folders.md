# 스튜디오와 세계관을 기능 폴더로 나누다

| 항목 | 내용 |
|------|------|
| Subject | `refactor(api): 스튜디오와 세계관을 기능 폴더로 나누다` |
| Full SHA | `13146fee6cec4de125c1ea2d0762c8299a03d26a` |
| Short SHA | `13146fe` |
| Branch | `feature/studio-worlds-folders` |
| Parent | `fda3871` |
| Date | 2026-11-12 15:59:03 +0900 |

## 주 내용

스튜디오와 세계관은 묶음 안에 같은 이름 폴더 하나만 있어 구별이 아니었다. 그 안의 파일을 하는 일마다 나눴다.

## 상세

### 배경

`apps/api/src`를 여덟 묶음으로 나눌 때 `studio`와 `worlds`는 기존 폴더를 한 단계만 넣어 `studio/studio`, `worlds/worlds`가 됐다. 파일 역할이 드러나지 않아 다시 나눈다.

### 변경 범위

- 스튜디오: `card`, `draft`, `portrait`, `publish`, `trial`, `route`
- 세계관: `document`, `edit`, `play`, `settings`, `admin`
- 모듈을 부르는 계정·요금·앱 모듈의 경로
- 공식 세계관 시험이 `apps/api/prisma`를 보게 한 단계 고침
- 초상 검수 시험의 가짜 AI 호출 경로를 `chat/ai`로 고침

### 기술 포인트

- Nest 모듈은 그대로다. 파일을 옮기고 상대 경로만 바꿨다.
- `route`와 `edit`에 각 묶음의 모듈과 공개 컨트롤러를 둔다.

### 안 한 것

- 다른 여섯 묶음의 내부 나누기
- 모듈을 합치거나 주소를 바꾸기

## 결과

### 동작 확인

- 스튜디오·세계관·요금 카드 시험 78개 통과. 초상 검수 4개는 경로를 고친 뒤 통과.
- 이번 이동으로 생긴 타입 오류는 없다. 예전에 있던 스펙 세 곳의 타입 오류는 그대로다.

### 리스크

- 경로만 바뀌므로 동작은 같아야 한다. 빠뜨린 `vi.mock`가 있으면 시험이 실제 AI를 부른다.

### 후속 작업

- develop과 main에 합친 뒤 함께 푸시한다.

### 관련 문서

- `apps/api/src/studio`
- `apps/api/src/worlds`
