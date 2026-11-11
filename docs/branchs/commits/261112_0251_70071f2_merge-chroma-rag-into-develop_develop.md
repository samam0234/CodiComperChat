# feature/chroma-rag into develop (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/chroma-rag into develop (no-ff)` |
| Full SHA | `70071f2abc1bacfb27094dd64d1138113f409a40` |
| Short SHA | `70071f2` |
| Branch | `develop` |
| Parent | `a1440fa, c5c0a72` |
| Date | 2026-11-12 02:51:55 +0900 |

## 주 내용

기억·공통 말투 벡터를 develop에 병합했다.

## 상세

### 배경

이번 말과 가까운 기억만 프롬프트에 넣으려고 ChromaDB를 더했다.

### 변경 범위

- `feature/chroma-rag`를 `--no-ff`로 develop에 합쳤다.

### 기술 포인트

가중치 학습은 없다. 저장소를 열지 못하면 글자 검색으로 돌아간다.

### 안 한 것

main 병합과 푸시는 이 기록 다음에 한다.

## 결과

### 동작 확인

병합 충돌은 없었다.

### 리스크

공개 API는 이 경로를 아직 모른다.

### 후속

main에 `--no-ff`로 병합한 뒤 develop과 main을 함께 푸시한다.

### 관련 문서

- `docs/STATUS.md`
