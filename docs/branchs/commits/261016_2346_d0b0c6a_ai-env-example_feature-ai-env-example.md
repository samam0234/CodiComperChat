# .env.example에 시험용 환경변수(LLM_FAKE 등) 안내 추가

| 항목 | 내용 |
|------|------|
| Subject | `docs(ai): .env.example에 시험용 환경변수(LLM_FAKE 등) 안내 추가` |
| Full SHA | `d0b0c6aeb77779f1d0092a3999422a18684b42f7` |
| Short SHA | `d0b0c6a` |
| Branch | `feature/ai-env-example` |
| Parent | `1cf1842` (develop) |
| Date | 2026-10-16T23:46:08+09:00 |

## 주 내용

- services/ai/.env.example에 시험용 환경변수 3개를 주석으로 추가: `LLM_FAKE`(가짜 LLM), `FAKE_LLM_DELAY_MS`(가짜 응답 지연), `FAKE_LLM_SERIAL`(한 번에 하나씩)
- 같은 내용을 개발자 PC의 services/ai/.env에도 주석으로 넣음(git 제외 파일이라 이 커밋에는 없음)

## 상세

**배경**
사용자 요청(".env.example 보고 .env에 적용, services/ai도 같이"). services/ai의 활성 키 두 개는 .env.example과 .env가 같았지만, 코드가 읽는 환경변수 중 세 개가 어디에도 안내되지 않았다.

**변경 범위**
services/ai/.env.example

**기술 포인트**
- `os.environ` 사용처를 모아 .env.example과 비교해 빠진 것을 찾았다. 켜면 모델 없이 고정된 가짜 답만 나오므로 값은 켜지 않은 주석으로 둔다.

**안 한 것**
없음

## 결과

**동작 확인**
- services/ai/.env를 읽었을 때 OLLAMA_* 그대로, LLM_FAKE 꺼짐
- services/ai/.env가 .gitignore에 걸려 있음

**리스크**
없음

**후속**
없음

**관련 문서**
없음
