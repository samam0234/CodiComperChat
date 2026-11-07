# 대화 모델 백엔드 두 가지와 호스팅 API일 때 나가는 데이터를 적는다

| 항목 | 내용 |
|------|------|
| Subject | `docs(ai): 대화 모델 백엔드 두 가지와 호스팅 API일 때 나가는 데이터를 적는다` |
| Full SHA | `60df6ab7309ad9c3da85db1ef189f11281f9c74c` |
| Short SHA | `60df6ab` |
| Branch | `feature/docs-gap-fill` |
| Parent | `e68cbe2` |
| Date | 2026-11-07 14:12:09 +0900 |

## 주 내용

- `services/ai/README.md`에 "대화 모델 백엔드 두 가지"(ollama / openai 호스팅 API + 예비 Ollama) 절을 더했다
- `openai`일 때 모든 대화 모델 호출의 내용이 공급자에게 간다는 것과, 그래서 `ADULT_MODE=off`로 둬야 한다는 제약을 적었다
- 환경변수 표에 `LLM_*`·`OLLAMA_WARMUP`·프리미엄 키를 더했다

## 상세

**배경**
사용자가 미비한 문서를 전체적으로 보강하라고 했다(2026-11-07). 코드(`llm.py`)를 읽어 보니 `LLM_BACKEND=openai`는 프리미엄 공급자를 고른 `/infer`를 뺀 모든 호출을 호스팅 API로 보낸다. README는 로컬 Ollama만 말하고 있었다.

**변경 범위**
`services/ai/README.md` 한 파일.

**기술 포인트**
성인 모드와 호스팅 API를 막는 코드 장치는 없어 TASKS T05로 넘겼다(다음 커밋).

**안 한 것**
코드는 바꾸지 않았다.

## 결과

**동작 확인**
문서 수정만. 내용은 `llm.py` 라우팅 코드를 읽고 옮겼다.

**리스크**
없음.

**후속**
SECURITY·TASKS·THIRD_PARTY에 같은 사실을 반영.
