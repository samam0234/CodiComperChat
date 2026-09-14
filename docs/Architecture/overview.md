# 시스템 개요

정본: `CodiComperChat_project_plan.md` §7.1. 상태: **코드 미착수 — 목표 구조.**

```text
브라우저
  → Next.js (React / TSX)                 apps/web
      → Nest.js (인증, 유저, 캐릭터,       apps/api
                 세션, 월드 스테이트, 로그)
          → PostgreSQL / Redis
          → FastAPI (추론, 세션 요약,       services/ai
                      이후 학습)
```

## 원칙

- 프론트는 FastAPI를 직접 호출하지 않는다
- FastAPI는 내부망에서만 Nest가 호출한다
- 학습 API는 외부에 열지 않는다
- Next.js Route에 무거운 추론을 넣지 않는다 (타임아웃·메모리)

## 왜 세 프레임워크인가 (계획서 §7.2)

- **Next.js**: 채팅 스트림, 세션 화면, 창작 공방, 캠페인 홈을 한 프론트에서
- **Nest.js**: 진짜 자산은 모델이 아니라 상태 — 유저/카드/세션/관계/훅/권한/결제까지 도메인 API가 커질 것을 전제
- **FastAPI**: 프롬프트 조립·스트리밍·요약은 Python 생태계가 편함. v1에서는 "연기·요약 엔진"이지 학습 공장이 아님

Next.js만으로도 API는 만들 수 있지만, 월드 스테이트와 권한이 커질수록 App Router API는 도메인 경계가 흐려진다는 것이 Nest를 두는 이유다.

관련: [layers.md](layers.md), [apps.md](apps.md), [data-flow.md](data-flow.md)
