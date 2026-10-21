# 프리미엄 모델의 코레딧 값을 1.5배로 올리기

| 항목 | 내용 |
|------|------|
| Subject | `feat(credits): 프리미엄 모델의 코레딧 값을 1.5배로 올리기` |
| Full SHA | `6da389c08a730ec809260276285ef3137594ee1d` |
| Short SHA | `6da389c` |
| Branch | `feature/credits-commands` |
| Parent | `f21ae27` (feature/credits-commands) |
| Date | 2026-10-21T22:31:39+09:00 |

## 주 내용

- 프리미엄 모델의 답 1번 코레딧 값을 1.5배로 올림 (소수는 올림)
- Claude: Haiku 5.5 8 · Haiku 4.5 15 · Sonnet 5 30 · Sonnet 5.5 38 · Opus 4.8 60 · Opus 5 68 · Opus 5.5 75 · Fable 5.1 120
- Grok(임시값): 4.5 30 · 4.6 38 · 4.7 45

## 상세

**배경**
사용자 지시("프리미엄 모델값은 너무 싼 것 같은데 코레딧 값을 1.5배 올리는 게 나을 것 같은데")에 따라 값을 올렸다. 원가 대비 덮는 폭이 2배 → 3배 넘게가 됐다.

**변경 범위**
apps/api/src/models/models.ts, e2e/tests/models.spec.ts, docs/plan/AI_MODEL_STRATEGY.md, docs/plan/NAVIGATION_IA.md

**기술 포인트**
- 코레딧은 정수라 7.5→8, 37.5→38, 67.5→68로 올림했다
- 같은 계열 안 성능 순서는 그대로 유지 (단위 테스트가 지킨다)
- 출석 1,000 코레딧으로 Opus 5.5 답 13번, Haiku 5.5 답 125번

**안 한 것**
없음

## 결과

**동작 확인**
- API 단위 테스트 172개
- e2e models.spec 7개

**리스크**
없음 (이미 쓴 코레딧 기록은 그대로, 새로 쓰는 답부터 새 값)

**후속**
없음

**관련 문서**
이 커밋
