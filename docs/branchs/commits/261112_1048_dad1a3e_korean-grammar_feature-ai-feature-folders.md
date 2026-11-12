# 대화 답과 추천의 한국어 맞춤법을 고치다

| 항목 | 내용 |
|------|------|
| Subject | `feat(ai): 대화 답과 추천의 한국어 맞춤법을 고치다` |
| Full SHA | `dad1a3e7783374ebfaa1a11b76830c16df530dc1` |
| Short SHA | `dad1a3e` |
| Branch | `feature/ai-feature-folders` |
| Parent | `9a6421c` |
| Date | 2026-11-12 10:48:14 +0900 |

## 주 내용

- 대화 답, 추천, 다시 쓰기, 월드 답이 나가기 전에 배운 한국어 맞춤법을 고친다.
- 됬·되요·아니예요·갈수있어·것같·조사가 두 번인 문장을 항상 같은 문장으로 바꾼다.
- 이미 맞는 문장(아이가, 한지우가, 어떡해)은 건드리지 않고, 고친 문장에 다시 적용해도 글이 같다.
- 화면에는 토큰이 먼저 나가고, 고친 전문이 다르면 그 전문으로 바꾼다.
- FastAPI를 기능 폴더(routes·orchestration·services·modules·repositories)로 나눈 정리를 같은 커밋에 넣었다.

## 상세

**배경**
대화 추천과 캐릭터 답에서 문법에 어긋난 문장이 나왔다. v1은 가중치 학습을 하지 않고 `/train`은 403이다. 작은 모델은 지시를 늘리면 이미 맞춰 둔 나레이션·말투를 놓친다.

**변경 범위**
`services/ai`의 한국어 교정과 기능 폴더, `apps/api`의 스트림 전문 교체, `docs/trainings/korean-grammar.md`.

**기술 포인트**
교정은 `grammar_pairs.json`과 받침 규칙이다. 로컬 모델 4질문에서 교정 전후 차이는 0/4였고, 배운 목록은 단위 시험이 전부 맞는지 본다.

**안 한 것**
모델 가중치 학습, 프롬프트에 틀린 철자 예시 넣기, 호칭·말투를 맞춤법 교정으로 바꾸기.

## 결과

**동작 확인**
`tests.test_korean` `tests.test_layer_boundaries` `tests.test_chroma_rag` `tests.test_nest_contract` 13개 통과. 한지우 4질문과 추천 3줄은 2026-11-12 `gemma4:e4b`로 확인했다.

**리스크**
배운 목록 밖의 어색한 문장은 그대로 나간다. 네 질문으로 모든 문장이 자연스럽다고 보지 않는다.

**후속**
새 오류가 반복되면 쌍을 추가하고 같은 시험을 유지한다.

**관련 문서**
[docs/trainings/korean-grammar.md](../../trainings/korean-grammar.md)
