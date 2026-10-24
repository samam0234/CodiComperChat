# AI 파이프라인 가이드

정본: `CodiComperChat_project_plan.md` §7.6, §7.7. 요약 다이어그램은 [../WORKFLOW.md](../WORKFLOW.md), 모델 전략은 [../plan/AI_MODEL_STRATEGY.md](../plan/AI_MODEL_STRATEGY.md).

## v1 요지

- 자체 학습 없음. LLM + 시스템 프롬프트 + 상태 RAG
- FastAPI(`services/ai`)는 연기·요약·판정 엔진이지 학습 공장이 아님 — 경로 전체는 [../plan/AI_MODEL_STRATEGY.md](../plan/AI_MODEL_STRATEGY.md)
- 숨은 디렉터는 매 턴 풀 생성이 아니라 짧은 체크 + 캐릭터 본 생성 1회

## 이 서비스가 하는 일

| 묶음 | 경로 | 하는 일 |
|------|------|---------|
| 대화 | `/infer` `/suggest-replies` `/ground-check` | 캐릭터 연기(행동은 `*별표*`, 장면 서술은 `@:` 나레이션), 대답 추천, 개인사 환각 검사 |
| 이야기 상태 | `/summarize` `/remember` | 요약·친밀도·복선, 장기 기억. 비밀 퀘스트 건넴·달성 후보 판정 + 전용 판정(인용 근거 대조, `summarization._verify`) |
| 공방 | `/draft-field` `/draft-quest` `/critique-test` `/moderate-image` | AI 초안·퀘스트 제작, 3턴 판정, 초상 검수 |
| 오퍼레이션 | `/mind` `/diary` `/board-posts` `/board-comments` | 속마음·일기·커뮤니티(메시지는 `/infer` 계열) |
| 그림 | `/photonet` `/webtoon/plan` `/webtoon/panel` | 장면 설계(LLM) → 프롬프트 조립 → 그림 엔진 → 그림 검수 — [photonet-engine.md](photonet-engine.md) |
| 에이전트 | `/assist` | 사용 안내 챗봇 |

그림 엔진은 `IMAGE_ENGINE=local`(기본, 같은 프로세스 diffusers) / `webui`. **LLM과 그림 엔진이 그래픽 메모리를 나눠 쓴다** — 장면 설계 직후 LLM을 내리고(`keep_alive 0`) 그림을 그린다.

## 돌리기 (전제 → 명령 → 결과)

| 전제 | 명령 | 결과 |
|------|------|------|
| Ollama + `gemma4:e4b` | `ollama serve` | `http://localhost:11434` |
| `services/ai/.venv` | `./.venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8000` | `/health` ok, `/docs`에 경로 목록 |
| 품질 평가 | `./.venv/Scripts/python.exe -m evals.run [--suite tone --repeat 3 -v]` | 묶음마다 통과율과 기준, 미달이면 종료 코드 1 |
| 모델 없이 시험 | `LLM_FAKE=1`로 띄우기 | 고정된 가짜 답과 작은 가짜 그림(e2e용) |
| 그림 엔진 | `pip install -r requirements-image.txt` + `services/ai/models/`에 체크포인트 | 코디포토넷·웹툰 "준비 중" 해제 ([photonet-engine.md](photonet-engine.md)) |

모델을 바꾸거나 프롬프트를 고치면 평가를 다시 돌린다. 평가 묶음과 기준: [services/ai/README.md](../../services/ai/README.md).

## 이 가이드가 다루지 않는 것

컴퓨터 비전/이미지 세그멘테이션 모델(YOLO 등)은 이 프로젝트와 무관하다. (그림 생성은 위 "그림" 묶음과 [photonet-engine.md](photonet-engine.md)가 다룬다.) 이 파일은 LLM 추론/요약 파이프라인만 다룬다.

## 벤더

개발은 로컬 Ollama `gemma4:e4b`. 제품 벤더는 계획서 §15 "아직 열려 있는 것"에 남아 있다. 정해지면 [../plan/AI_MODEL_STRATEGY.md](../plan/AI_MODEL_STRATEGY.md)와 이 문서를 함께 갱신한다.
