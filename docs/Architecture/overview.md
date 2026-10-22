# 시스템 개요

정본: `CodiComperChat_project_plan.md` §7.1. 최종 갱신 2026-10-16 — **구현된 구조**(배포는 아직).

```text
브라우저
  │  (화면·서버 액션. 로그인 토큰은 httpOnly 쿠키)
  ▼
Next.js  apps/web :3000          Next.js  console :3001 (운영자 전용, 따로 로그인)
  │                                 │  같은 방식으로 Nest만 부른다 (/admin/*, AdminGuard)
  │                                 ▼
Next.js  apps/web :3000
  │  proxy.ts: 요청마다 CSP(nonce) · 회원 전용 화면 1차 거름망
  │  서버 컴포넌트·서버 액션만 Nest를 부른다 (API_BASE_URL, Authorization: Bearer)
  ▼
Nest.js  apps/api :4000 ─────────────┬──▶ PostgreSQL :5432  (Prisma 7, 테이블 15개)
  │  인증·계정·캐릭터·대화·기억·        ├──▶ 페르소나 지식 JSON (apps/api/data/personas, 파일)
  │  공방·신고·검수·결제·요청 한도      ├──▶ SMTP (메일 발송, MAIL_SMTP_URL)
  │                                    └──▶ 토스페이먼츠 API (결제 승인·취소)
  │  AI 호출 대기열 (동시 수 제한, 기다리는 답 우선)
  ▼
FastAPI  services/ai :8000  (내부 전용)
  │  연기(/infer)·요약·기억·판정·대답 추천·AI 초안·초상 검수
  ▼
Ollama :11434  (gemma4:e4b, 글·그림)

브라우저 ──▶ 토스 결제창 (js.tosspayments.com) ──▶ /billing/success ──▶ Nest가 승인
```

## 원칙

- 프론트는 FastAPI를 직접 호출하지 않는다 (Nest만 부른다)
- FastAPI는 내부망에서만 Nest가 호출한다
- 학습 API는 외부에 열지 않는다 (`/train` 403)
- Next.js Route에 무거운 추론을 넣지 않는다 — 웹의 `app/api/*`는 초상 그림 중계와 CSP 보고 받기뿐
- 결제 비밀 키·SMTP 비밀번호는 Nest에만 있다. 웹에는 토스 공개 키만 내려간다

## 왜 세 프레임워크인가 (계획서 §7.2)

- **Next.js**: 채팅, 대화 상태 패널, 창작 공방, 홈을 한 프론트에서
- **Nest.js**: 진짜 자산은 모델이 아니라 상태 — 유저/카드/대화/관계/복선/권한/결제까지 도메인 API가 커질 것을 전제(실제로 그렇게 됐다)
- **FastAPI**: 프롬프트 조립·판정·요약은 Python 쪽이 편함. v1에서는 "연기·요약 엔진"이지 학습 공장이 아님

관련: [layers.md](layers.md), [apps.md](apps.md), [data-flow.md](data-flow.md), [../plan/CURRENT_STACK.md](../plan/CURRENT_STACK.md)
