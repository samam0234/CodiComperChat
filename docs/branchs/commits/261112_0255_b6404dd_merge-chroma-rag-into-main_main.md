# develop into main (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: develop into main (no-ff)` |
| Full SHA | `b6404dd6ed72297da28db8f2b295a86fcf849808` |
| Short SHA | `b6404dd` |
| Branch | `main` |
| Parent | `a1440fa, 6772ab3` |
| Date | 2026-11-12 02:55:02 +0900 |

## 주 내용

기억·공통 말투 벡터를 main에 병합했다.

## 상세

### 배경

이번 말과 가까운 기억만 프롬프트에 넣으려고 ChromaDB를 더했다.

### 변경 범위

- develop을 `--no-ff`로 main에 합쳤다.

### 기술 포인트

가중치 학습은 없다. 저장소를 열지 못하면 글자 검색으로 돌아간다.

### 안 한 것

공개 서버는 다시 올리지 않았다. 푸시는 이 기록 다음에 develop과 main을 함께 한다.

## 결과

### 동작 확인

병합 충돌은 없었다.

### 리스크

웹이 먼저 배포되면 공개 API는 이 경로를 아직 모른다. 화면 대화는 글자 검색으로 이어 간다.

### 후속

develop을 main에 맞춘 뒤 둘을 함께 푸시한다.

### 관련 문서

- `docs/STATUS.md`
