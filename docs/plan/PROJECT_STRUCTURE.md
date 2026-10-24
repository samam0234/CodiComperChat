# 프로젝트 구조

정본: `CodiComperChat_project_plan.md` §7.3. 최종 갱신 2026-10-24 — 실제 폴더 기준.

## 모노레포 최상위

```text
repo/
├── package.json            # npm workspaces 루트 (workspaces: ["apps/*", "console"]), 공통 명령(dev·test·e2e·bench·ci:local)
├── LICENSE · SECURITY.md · THIRD_PARTY_NOTICES.md   # 저장소 라이선스(독점) · 보안 정책 · 제3자 고지
├── apps/
│   ├── web/                # Next.js 16 (React 19, App Router, TSX)
│   └── api/                # Nest.js 12 (TypeScript, ESM) + Prisma 7
├── console/                # 운영자 전용 콘솔 — Next.js 16, 포트 3001 (워크스페이스)
├── services/
│   └── ai/                 # FastAPI (Python 3.12) — 워크스페이스 밖, 자체 .venv
├── e2e/                    # 웹 화면 자동 테스트(Playwright) + 부하 측정(bench.mjs)
├── scripts/                # ci-local.mjs(CI를 깨끗한 클론에서 재현) · start-sd-webui.cmd(개발용 WebUI 그림 엔진)
├── .github/workflows/ci.yml
├── docker-compose.yml      # postgres · mailpit (web·api·ai 컨테이너화는 배포 단계에서)
└── docs/
```

## `apps/web`

```text
apps/web/
├── proxy.ts                # 요청마다 CSP(nonce) + 회원 전용 화면 1차 거름망
├── next.config.ts          # 보안 헤더, e2e용 별도 빌드 폴더(NEXT_DIST_DIR)
├── app/
│   ├── layout.tsx · globals.css   # 셸(헤더·드로어·푸터) · 디자인 토큰(라이트·다크) — docs/plan/DESIGN.md
│   ├── page.tsx            # 홈: 히어로 · 이어서 대화하기 · 캐릭터 카드
│   ├── popular/ agents/    # 인기 · 사용 안내 챗봇
│   ├── characters/[id]/    # 상세 · chat/(대화, saved 이어하기, memories 기억, settings 상태설정,
│   │                       #   mind·diary·messages·community·webtoon 오퍼레이션, photonet·secret-quest·adult-dialog 열림 상자)
│   ├── library/            # 대화 목록
│   ├── studio/ · studio/[id]/   # 공방 목록 · 8단계 편집(7층 + 비밀 퀘스트, AI 초안·퀘스트 AI 제작, 3턴 테스트, 초상, 발행)
│   ├── me/ settings/       # 마이페이지(프로필 캐릭터, 결제 내역, 이메일 인증) · 설정(테마, 계정, 비밀번호, 탈퇴)
│   ├── login/ signup/ forgot-password/ reset-password/ verify-email/
│   ├── pricing/ billing/{mock,success,fail}/   # 요금 안내 · 결제 흐름
│   ├── terms/ privacy/ business/ support/      # 약관 등 (법률 검토 전 초안)
│   ├── actions/            # 서버 액션 — Nest를 부르는 곳 (auth, studio, billing, admin-* …)
│   └── api/                # 라우트 핸들러: 그림 중계(초상·코디포토넷·웹툰 컷), CSP 보고 받기
├── components/             # 셸, 캐릭터 카드·아바타, 입력창, 대화 상자, 약관 틀, 로고
└── lib/                    # 서버 전용 데이터 읽기(auth, conversations, billing …), 카드 타입, 시간 표시
```

웹은 **Nest만** 부른다(`API_BASE_URL`). 로그인 토큰은 httpOnly 쿠키에 있고 서버 액션·서버 컴포넌트가 붙여 보낸다.

## `console` (운영 콘솔)

```text
console/
├── proxy.ts                # 요청마다 CSP(nonce, 외부 출처 없음) + 로그인 화면 말고는 쿠키 없으면 로그인으로
├── next.config.ts          # 보안 헤더 + X-Robots-Tag noindex
├── app/
│   ├── layout.tsx          # 왼쪽 메뉴 셸 (로그인 전에는 가운데 상자만)
│   ├── page.tsx            # 대시보드 (GET /admin/stats)
│   ├── login/              # 운영자만 로그인 (console_session 쿠키)
│   ├── reports/ portraits/ characters/ users/
│   ├── actions/            # 서버 액션: 로그인·로그아웃, 운영자 처리(내리기·복구·검수·등급·환불)
│   └── api/                # 운영자 전용 그림 중계 (검수 대기 초상, 캐릭터 초상)
├── components/             # 메뉴, 페이지 머리말, 확인 상자, 폼, 로고
└── lib/                    # api.ts(Nest 주소·쿠키·requireAdmin), relay.ts, 타입, 시간 표시
```

## `apps/api`

기능별 모듈. 각 모듈은 `*.module.ts` + `*.controller.ts` + `*.service.ts`를 기본으로 한다.

```text
apps/api/
├── prisma/                 # schema.prisma, migrations/, seed.mjs
├── prisma.config.ts
├── scripts/                # user:role · user:plan · persona:build · persona:search · billing:check · mail:check
├── data/personas/          # 페르소나 지식 JSON (git 제외, README만 올라감)
└── src/
    ├── main.ts             # 부트스트랩: 보안 헤더, trust proxy, 초상용 raw body
    ├── app.module.ts       # 모듈 조합 + 전역 요청 한도 가드
    ├── auth/               # 가입·로그인·내 정보·비밀번호·이메일 인증·비밀번호 찾기, AuthGuard·AdminGuard, 토큰 세대
    ├── account/            # 회원 탈퇴, 성인 확인(생년월일+동의, adult.ts)
    ├── mail/               # 메일 발송 (SMTP / 폴더 / 로그)
    ├── characters/         # 목록·상세·초상
    ├── character-chat/     # 캐릭터 대화·새로하기·이어하기·대답 추천 (컨텍스트 조립)
    ├── conversations/      # 대화 기록 저장·목록
    ├── memories/           # 장기 기억 정리·보기·지우기
    ├── campaign-state/     # 지난 이야기(요약·친밀도·복선) 정리
    ├── chat-state/         # 상태설정(친밀도·호칭 직접 설정)
    ├── extras/             # 엑스트라
    ├── personas/           # 내 프로필 캐릭터
    ├── persona-rag/        # 페르소나 지식 저장소·검색
    ├── studio/             # 공방: 초안·AI 초안·3턴 테스트·발행·초상·검수(+운영자 초상 검수)
    ├── admin/              # 콘솔 대시보드 통계·캐릭터 전체 목록·운영자 초상
    ├── reports/            # 신고 + 운영자 신고함·내리기·복구
    ├── billing/            # 상품·주문·승인·환불·결제 내역 + 운영자 계정 등급·주문
    ├── plan/               # 요금 등급 계산
    ├── credits/            # 코레딧(출석·차감·환불·보상·내역), 값표
    ├── models/             # 대화 모델 목록·조건(강화 무료 하루 한도·초과 코레딧, 프리미엄)
    ├── operations/         # 오퍼레이션(심리 탐구·일기·메시지·커뮤니티), 코디포토넷, 웹툰
    ├── quests/             # 비밀 퀘스트(진행·판정 반영·보상)
    ├── ai/                 # FastAPI 호출(postToAi) + 호출 대기열
    ├── security/           # 요청 한도(메모리·DB 저장소)
    ├── agent-chat/         # 사용 안내 챗봇
    ├── campaigns/          # 계획서 §13.1 경로 자리 (501, 실제 대화는 character-chat)
    ├── health/             # GET /health (+ AI 대기열 상태)
    └── prisma/             # PrismaService
```

**ESM 주의:** 상대 import에 `.js` 확장자를 붙인다(`./app.module.js`).

## `services/ai`

```text
services/ai/
├── app/
│   ├── main.py             # FastAPI, 라우터 등록, services/ai/.env 읽기
│   ├── routes/             # health · infer · summarize · critique_test · remember · suggest · assist · ground · draft(+draft-quest) · moderate · operations · photonet · webtoon · train(403)
│   ├── schemas/            # 요청/응답 계약 (WireModel = camelCase)
│   └── services/           # llm(Ollama 호출) · inference · summarization · critique · remember · suggestion · assist · grounding · draft · image_moderation · operations · photonet · photonet_moderation · webtoon · image_engine · image_local(diffusers) · fake_llmration · fake_llm(시험용)
├── evals/                  # AI 품질 평가 (python -m evals.run) — 말투·지시 무시·메타·강의·개인사·판정 안정성·이미지 검수
├── models/                 # 그림 모델 체크포인트 (git 제외, 수 GB)
├── requirements.txt        # 기본 (가벼움)
├── requirements-image.txt  # 그림 엔진: PyTorch CUDA · diffusers (선택)
└── README.md
```

**Repository 계층이 없는 것은 의도적이다.** FastAPI는 DB를 직접 보지 않는다 (기획서 §7.4) — [../Architecture/layers.md](../Architecture/layers.md).

## `e2e`

```text
e2e/
├── env.mjs · prepare.mjs   # 전용 포트(3101/4101/8101)·DB·폴더, 준비(DB 생성·마이그레이션·비우기·검증 빌드)
├── servers/                # e2e용 web·api·ai 서버 실행 (가짜 LLM, 가짜 결제, 메일은 폴더로)
├── helpers.ts              # API 호출·가입·로그인 쿠키·SQL·메일함 읽기
├── tests/*.spec.ts         # 20개: 인증·이메일·대화·명령어·글 꾸미기·모델·공방·검수·신고·결제·콘솔·오퍼레이션·웹툰·퀘스트·테마·보안 등
└── bench.mjs               # 부하 측정 (npm run bench)
```

## 문서와 코드의 관계

| 위치 | 성격 |
|------|------|
| `CodiComperChat_project_plan.md` (루트) | 제품 기획 원본 |
| `docs/plan/` | 원본에서 파생된 개발 스펙 |
| `apps/`, `services/`, `e2e/` | 실제 코드 |

구조를 바꾸면 이 문서와 [CURRENT_STACK.md](CURRENT_STACK.md)를 함께 고친다.

관련: [CURRENT_STACK.md](CURRENT_STACK.md), [../Architecture/apps.md](../Architecture/apps.md)
