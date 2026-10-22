# AI 파이프라인 가이드

정본: `CodiComperChat_project_plan.md` §7.6, §7.7. 요약 다이어그램은 [../WORKFLOW.md](../WORKFLOW.md), 모델 전략은 [../plan/AI_MODEL_STRATEGY.md](../plan/AI_MODEL_STRATEGY.md).

## v1 요지

- 자체 학습 없음. LLM + 시스템 프롬프트 + 상태 RAG
- FastAPI(`services/ai`)는 연기·요약·판정 엔진이지 학습 공장이 아님 — 경로 전체는 [../plan/AI_MODEL_STRATEGY.md](../plan/AI_MODEL_STRATEGY.md)
- 숨은 디렉터는 매 턴 풀 생성이 아니라 짧은 체크 + 캐릭터 본 생성 1회

## 돌리기 (전제 → 명령 → 결과)

| 전제 | 명령 | 결과 |
|------|------|------|
| Ollama + `gemma4:e4b` | `ollama serve` | `http://localhost:11434` |
| `services/ai/.venv` | `./.venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8000` | `/health` ok, `/docs`에 경로 목록 |
| 품질 평가 | `./.venv/Scripts/python.exe -m evals.run [--suite tone --repeat 3 -v]` | 묶음마다 통과율과 기준, 미달이면 종료 코드 1 |
| 모델 없이 시험 | `LLM_FAKE=1`로 띄우기 | 고정된 가짜 답(e2e용) |

모델을 바꾸거나 프롬프트를 고치면 평가를 다시 돌린다. 평가 묶음과 기준: [services/ai/README.md](../../services/ai/README.md).

## 이 가이드가 다루지 않는 것

컴퓨터 비전/이미지 세그멘테이션 모델(YOLO 등)은 이 프로젝트와 무관하다 — 코디컴퍼챗은 텍스트 기반 캐릭터 캠페인 서비스다. 이 파일은 오직 LLM 추론/요약 파이프라인만 다룬다.

## 벤더

개발은 로컬 Ollama `gemma4:e4b`. 제품 벤더는 계획서 §15 "아직 열려 있는 것"에 남아 있다. 정해지면 [../plan/AI_MODEL_STRATEGY.md](../plan/AI_MODEL_STRATEGY.md)와 이 문서를 함께 갱신한다.
