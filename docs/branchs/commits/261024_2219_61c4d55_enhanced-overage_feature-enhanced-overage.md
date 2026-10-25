# 강화 무료는 하루 30번 뒤 자정까지 1번에 10 코레딧

| 항목 | 내용 |
|------|------|
| Subject | `feat(models): 강화 무료는 하루 30번 뒤 자정까지 1번에 10 코레딧` |
| Full SHA | `61c4d55137cce9144a38981b0af167c8d24b520b` |
| Short SHA | `61c4d55` |
| Branch | `feature/enhanced-overage` |
| Parent | `ec96725` (develop) |
| Date | 2026-10-24T22:19:41+09:00 |

## 주 내용

- 강화 무료(gemma4:12b): 무료 등급은 하루 30번 무료, 그 뒤 한국 시각 자정까지 1번에 10 코레딧(예전에는 잠김)
- 코레딧이 모자라면 NO_CREDITS로 잠김. 대화에 저장된 모델이면 기본 모델로 내려가 대화는 이어짐
- GET /models에 overage(10). 고르기 칸: "오늘 30/30 · 이후 1번 10 코레딧"(부족하면 "· 코레딧 부족"). 답의 사용량에 횟수와 쓴 코레딧을 함께
- 프로 등급 무제한 그대로. 마이페이지 등급 혜택 문구 갱신

## 상세

**배경**
사용자 요청("강화 무료 모델은 일반 이용자면 하루 30번 이상 전부 사용하면 한국 시간 자정까지는 한번 대화하는데 10 코레딧 소비").

**변경 범위**
apps/api/src/models, apps/web(채팅 모델 고르기, 마이페이지), e2e(models), docs(AI_MODEL_STRATEGY, API)

**기술 포인트**
- 한도 안 횟수는 기존 원자적 증가(model_usage)로 세고, 한도에 닿아 증가가 안 되면 같은 요청에서 코레딧 10을 원자적으로 차감(credits.spend). 답을 못 만들면 기존 release가 환불
- 코레딧으로 쓴 답은 model_usage를 늘리지 않음 — 횟수는 한도에 머묾
- 코레딧 기록 modelId=enhanced, 사유 MODEL_USE

**안 한 것**
없음

## 결과

**동작 확인**
- 모델 단위 시험 10개, 타입 검사 api·web
- e2e models·mypage 10개 통과(한도 뒤 코레딧 부족 거절 → 기본 모델 → 출석 뒤 10 코레딧 차감, 화면 문구)

**리스크**
없음

**후속**
채팅 *텍스트* 회색 기울임, @: 나레이션, 웹툰 오퍼레이션

**관련 문서**
docs/plan/AI_MODEL_STRATEGY.md, docs/API_DOCUMENTATION.md
