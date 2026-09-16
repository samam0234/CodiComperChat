# FastAPI 추론 서비스 라우트 뼈대 추가

| 항목 | 내용 |
|------|------|
| Subject | `feat(ai): FastAPI 추론 서비스 라우트 뼈대 추가` |
| Full SHA | `448b009bb2740abab8bcf018bb113245f4e0ebd0` |
| Short SHA | `448b009` |
| Branch | `feature/ai-scaffold` |
| Parent | `0664173` |
| Date | 2026-09-15 22:28:19 +0900 |

## 주 내용

- `services/ai` 생성: FastAPI 0.141.1 / uvicorn 0.53.0 / Python 3.12.10
- 라우터 5개(`health`, `infer`, `summarize`, `critique_test`, `train`) + 서비스 3개 분리
- 기획서 §13.2 엔드포인트 6개 배선 — `GET /health`만 200
- `/infer` `/summarize` `/critique-test` → **501**, `/train` 계열 → **403**
- 포트 8000 확정, `requirements.txt`를 실제 설치본으로 고정
- 구현 반영으로 문서 10종 갱신

## 상세

**배경**
기획서 §10의 5번(FastAPI `/infer` 스트림 + Nest 프록시)에 들어가기 전에, §13.2에서 합의된 내부 API 경계를 라우트로 고정했다. web·api에 이어 세 번째 앱의 뼈대다.

**변경 범위**
- `services/ai/`: `app/main.py`, `app/routes/` 5개, `app/services/` 3개, `requirements.txt`, `README.md`
- 문서: `API_DOCUMENTATION.md`, `plan/CURRENT_STACK.md`, `plan/PROJECT_STRUCTURE.md`, `plan/AI_MODEL_STRATEGY.md`, `plan/TESTING.md`, `Architecture/layers.md`, `Architecture/apps.md`, `guidance/getting-started.md`, `web_management/ports-inventory.md`, `docs/README.md`

**기술 포인트**
- **501과 403을 구분했다.** `/infer` `/summarize` `/critique-test`는 아직 안 만든 것(501)이고, `/train` `/train/{job_id}`는 v1이 자체 가중치 학습을 하지 않기로 한 **정책상 차단**(403)이다 (기획서 §7.6, §7.7). 둘을 같은 코드로 묶으면 나중에 "구현하다 만 것"으로 오해되므로 응답 코드와 메시지를 나눴다.
- 미구현 핸들러의 반환 타입이 `NoReturn`이라 FastAPI가 이것으로 응답 스키마를 만들려다 **기동 자체가 실패**했다. 데코레이터에 `response_model=None`을 붙여 해결. 같은 패턴을 쓰는 라우트가 추가되면 동일하게 필요하다.
- `requirements.txt`를 처음엔 기억에 의존해 `fastapi==0.120.4`로 적었는데, 실제 설치해보니 존재하지 않는 버전이었다. 설치 후 `pip freeze` 결과(`0.141.1`)로 고정했다. 버전은 추정하지 말고 확인할 것.
- Python은 3.12를 썼다. 머신에 3.10도 있지만 `py -3.12`로 venv를 만들었다. 기획서에 Python 버전 지정이 없어 설치된 것 중 최신 안정 버전을 택했다.
- `services/ai`는 npm workspaces 밖이다. 루트 `npm install`로 설치되지 않으며 venv를 따로 만들어야 한다.

**안 한 것**
- 요청/응답 Pydantic 모델 — `/summarize`의 반환 형태(§13.4)는 문서에만 두고 코드로는 아직 고정하지 않음. 실제 구현과 함께 넣는다
- **서비스 토큰 인증** (기획서 §7.8) — api가 아직 ai를 호출하지 않는다. 실제 호출이 생길 때 토큰과 함께 추가
- LLM 클라이언트 — 호스티드 벤더 미정 (기획서 §15)
- pytest 설정 — 테스트 러너 미도입
- ruff/mypy 등 린터·타입체커 — 스택 결정을 늘리지 않으려고 보류

## 결과

**동작 확인**
- uvicorn 기동 성공, 라우트 7종 수동 확인: `/health` 200, `/infer`·`/summarize`·`/critique-test` 501, `/train`·`/train/{job_id}` 403, 없는 경로 404
- `/openapi.json`에 경로 6개 정상 노출, `/docs` 대화형 문서 생성됨
- 501/403 응답 본문에 한국어 사유와 기획서 장 번호가 담기는 것 확인

**리스크**
- 테스트가 없다. web·ai 모두 자동 테스트가 없고 api만 e2e 2건이 있다.
- 세 앱이 서로 연결되지 않은 상태라, 경계(웹→api→ai)가 실제로 지켜지는지는 아직 검증되지 않았다.

**후속**
- `feature/prisma-schema`: Prisma 스키마 (기획서 §10 2번)
- Nest → FastAPI `/infer` 프록시 (§10 5번) 시 서비스 토큰 + CORS 함께 처리
- `docker-compose.yml`: web/api/ai/postgres/redis 5개 서비스

**관련 문서**
`docs/API_DOCUMENTATION.md`, `docs/Architecture/layers.md`, `docs/plan/AI_MODEL_STRATEGY.md`, `services/ai/README.md`
