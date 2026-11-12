# feature/ai-feature-folders into develop (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/ai-feature-folders into develop (no-ff)` |
| Full SHA | `c0a9e04aee35455cd17af0b8e0316a6facd42829` |
| Short SHA | `c0a9e04` |
| Branch | `develop` |
| Parent | `9a6421c, f0edc23` |
| Date | 2026-11-12 10:49:22 +0900 |

## 주 내용

- `feature/ai-feature-folders`를 develop에 `--no-ff`로 병합했다.
- 대화 답·추천·다시 쓰기·월드 답의 한국어 맞춤법 교정과 FastAPI 기능 폴더 정리가 들어간다.

## 상세

**배경**
기능 브랜치 작업을 develop에 합친다.

**변경 범위**
`services/ai`, `apps/api` 스트림 전문 교체, `docs/trainings/korean-grammar.md`.

**기술 포인트**
가중치 학습은 없다. 교정은 출력 직전에 배운 오류만 고친다.

**안 한 것**
main 병합과 푸시는 이 기록 다음이다.

## 결과

**동작 확인**
병합 전 `tests.test_korean` `tests.test_layer_boundaries` `tests.test_chroma_rag` `tests.test_nest_contract` 13개 통과.

**리스크**
배운 목록 밖의 어색한 문장은 그대로다.

**후속**
main에 `--no-ff`로 병합한 뒤 develop을 main에 맞추고 둘을 함께 푸시한다.

**관련 문서**
[docs/trainings/korean-grammar.md](../../trainings/korean-grammar.md)
