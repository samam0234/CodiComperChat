# PC 없이 무료로 24시간 돌리는 무료 호스팅 API 백엔드와 예비 Ollama 추가

| 항목 | 내용 |
|------|------|
| Subject | `feat(ai): PC 없이 무료로 24시간 돌리는 무료 호스팅 API 백엔드와 예비 Ollama 추가` |
| Full SHA | `9f5eb22cb81dc0598f4e241cba804af49540cdfb` |
| Short SHA | `9f5eb22` |
| Branch | `claude/project-thread-po3i10` |
| Parent | `c61a013` |
| Date | 2026-11-06 14:01:35 +0000 |

## 주 내용

- 대화 모델을 OpenAI 호환 호스팅 API로 부르는 백엔드를 추가했다(`LLM_BACKEND=openai`, `LLM_API_BASE`·`LLM_API_MODEL`·`LLM_API_KEY`)
- API가 한도 초과(429)·서버 오류·시간 초과·연결 불가일 때 Ollama로 대신 답하는 폴백(`LLM_FALLBACK_OLLAMA=1`). 키 오류(401)는 덮지 않는다
- 구조화 출력(json_schema)을 거절하는 API(400)는 스키마를 지시문에만 넣어 한 번 더 부른다. 코드블록으로 감싼 JSON은 벗긴다
- Oracle compose의 `ai`를 프로필 `free-api`·`fallback`·`cpu-ai`로 정리, 환경변수 예시 갱신
- deploy-guide.html: 무료 24시간 AI 조사표, 구성도, 4단계(키 발급), 8단계(선택: GPU PC) 갱신

## 상세

**배경**
사용자가 "PC를 켜 두지 않고 비용 없이 24시간 AI 서버를 돌릴 방법"을 요청했다. 조사한 결과 24시간 무료 GPU는 없다(Colab·Kaggle 세션 12시간, ZeroGPU 하루 5분, Modal 월 $30 크레딧 후 과금, Together 무료 폐지, Oracle 무료는 CPU만). 그래서 모델을 직접 돌리는 대신 무료 호스팅 API의 Gemma 4 31B를 부르고, Oracle 무료 VM의 CPU Ollama를 예비로 둔다.

**변경 범위**
services/ai(llm.py, 시험 test_llm_openai.py, .env.example), deploy/oracle(compose, .env.example), docs(DEPLOYMENT.md, guidance/environment.md, web_management/deploy-guide.html).

**기술 포인트**
- Nest가 넘기는 Ollama 모델 태그(gemma4:12b 등)는 openai 백엔드에서 무시하고 `LLM_API_MODEL`을 쓴다. 폴백 때는 원래 태그로 Ollama를 부른다
- 폴백 대상은 "API가 지금 못 답하는" 실패만이다(408·425·429·5xx·시간 초과·연결). 키·요청 오류는 설정 문제라 숨기지 않는다
- 한도 숫자는 제3자 집계 사이트가 2026-11-05에 호출해 본 값이다(NIM 분당 40·하루 1만, OpenRouter 하루 50)

**안 한 것**
- 실제 NIM·AI Studio 호출(키 없음). 모델 이름·구조화 출력 지원·한국어 품질은 첫 배포 때 확인해야 한다
- 이용자별·서비스 전체 일일 한도 차단(앱 쪽 예산 제어)
- 그림 엔진의 무료 대안(없음, 기능이 잠긴다)

## 결과

**동작 확인**
- AI 단위 시험 71개 통과(새 openai 백엔드 시험 10개: 요청 모양, 스키마 재시도, 429·5xx·연결 실패 폴백, 401 비폴백, 설정 누락)
- `docker compose config`로 프로필 4가지 서비스 목록 확인(free-api, free-api+fallback, cpu-ai, 없음)
- deploy-guide.html 태그 짝 검사, 데스크톱·모바일 가로 넘침 없음

**리스크**
- 무료 API는 이용자 대화를 외부로 보내고 무료 티어는 학습에 쓰일 수 있다. 처리방침 갱신과 법률 검토가 필요하다
- 한도는 이용자 전체가 나눠 쓴다. 이용자가 늘면 막힌다
- Gemma 4의 JSON 출력 안정성은 호스팅 API에서 실측 전이다

**후속**
- 키 발급 뒤 실제 호출로 모델 이름·퀘스트 판정·요약 JSON을 확인하고 결과를 trainings/에 남긴다

**관련 문서**
- docs/web_management/deploy-guide.html, docs/guidance/environment.md, docs/DEPLOYMENT.md
