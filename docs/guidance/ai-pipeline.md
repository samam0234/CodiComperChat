# AI 파이프라인 가이드

정본: `CodiComperChat_project_plan.md` §7.6, §7.7. 요약 다이어그램은 [../WORKFLOW.md](../WORKFLOW.md), 모델 전략은 [../plan/AI_MODEL_STRATEGY.md](../plan/AI_MODEL_STRATEGY.md).

## v1 요지

- 자체 학습 없음. 외부/호스티드 LLM + 시스템 프롬프트 + 상태 RAG
- FastAPI(`services/ai`)는 연기·요약 엔진 (`/infer`, `/summarize`, `/critique-test`)이지 학습 공장이 아님
- 숨은 디렉터는 매 턴 풀 생성이 아니라 짧은 체크 + 캐릭터 본 생성 1회

## 이 가이드가 다루지 않는 것

컴퓨터 비전/이미지 세그멘테이션 모델(YOLO 등)은 이 프로젝트와 무관하다 — 코디컴퍼챗은 텍스트 기반 캐릭터 캠페인 서비스다. 이 파일은 오직 LLM 추론/요약 파이프라인만 다룬다.

## 벤더 (미정)

호스티드 LLM 벤더는 계획서 §15 "아직 열려 있는 것"에 남아 있다. 정해지면 [../plan/AI_MODEL_STRATEGY.md](../plan/AI_MODEL_STRATEGY.md)와 이 문서를 함께 갱신한다.
