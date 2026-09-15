# 프로젝트 구조 (기획)

정본: `CodiComperChat_project_plan.md` §7.3. 상태: **세 앱 모두 뼈대 구현 시작됨. `docker-compose.yml`만 미착수.**

## 모노레포 최상위

```text
repo/
├── package.json       # npm workspaces 루트 (workspaces: ["apps/*"])
├── apps/
│   ├── web/           # Next.js (React, TSX) — 구현 시작됨
│   └── api/           # Nest.js (TypeScript, ESM) — 구현 시작됨
├── services/
│   └── ai/            # FastAPI (Python 3.12) — 구현 시작됨. 워크스페이스 밖
└── docker-compose.yml # 미착수
```

## `apps/web` 현재 구조

```text
apps/web/
├── app/
│   ├── layout.tsx          # 루트 레이아웃: 헤더 + main + 푸터
│   ├── globals.css         # 테마 토큰(light/dark) + 기본 리셋
│   ├── page.tsx            # 홈
│   ├── popular/            # 인기
│   ├── agents/             # 에이전트
│   ├── library/            # 대화 목록(라이브러리)
│   ├── studio/             # 제작 (캐릭터 공방)
│   ├── me/                 # 마이페이지
│   ├── settings/           # 설정
│   ├── terms/ privacy/ business/ support/   # 푸터 정책·고객센터
│   └── favicon.ico
├── components/
│   ├── site-header.tsx     # 'use client' — 헤더 + 햄버거
│   ├── site-drawer.tsx     # 'use client' — 우측 드로어
│   ├── site-footer.tsx     # 서버 컴포넌트
│   ├── page-placeholder.tsx
│   └── *.module.css        # 컴포넌트별 CSS Module
├── AGENTS.md / CLAUDE.md   # next dev가 자동 생성·갱신 (수정 금지)
├── next.config.ts
├── package.json
└── tsconfig.json           # import alias: @/* → ./*
```

라우팅은 App Router 파일 시스템 기반이며, 라벨↔경로 매핑은 [NAVIGATION_IA.md](NAVIGATION_IA.md)에 있다.

## `apps/api` 현재 구조

기능별 모듈 분리. 각 모듈은 `*.module.ts` + `*.controller.ts` + `*.service.ts` 3종을 기본으로 한다.

```text
apps/api/
├── src/
│   ├── main.ts             # bootstrap, PORT ?? 4000
│   ├── app.module.ts       # 조합 루트 (기능 모듈만 import)
│   ├── health/             # GET /health — 유일하게 실제 동작
│   ├── auth/               # POST /auth/login, /auth/logout
│   ├── characters/         # GET /characters
│   ├── campaigns/          # 캠페인·세션·메시지·로그북
│   └── studio/             # /studio/characters (초안·수정·테스트·발행)
├── test/app.e2e-spec.ts    # vitest e2e
├── nest-cli.json
├── package.json
├── tsconfig.json           # module/moduleResolution: nodenext
├── vitest.config.ts / vitest.config.e2e.ts
└── oxlint.json
```

**ESM 주의:** `"type": "module"`이라 상대 import에 `.js` 확장자를 붙여야 한다 (`./app.module.js`). TS 파일을 가리키더라도 `.js`로 쓴다.

## `services/ai` 현재 구조

라우터와 서비스를 분리한다 (`Route → Service → LLM 클라이언트`).

```text
services/ai/
├── app/
│   ├── main.py              # FastAPI 인스턴스, 라우터 등록
│   ├── routes/
│   │   ├── health.py        # GET /health — 유일하게 실제 동작
│   │   ├── infer.py         # POST /infer
│   │   ├── summarize.py     # POST /summarize
│   │   ├── critique_test.py # POST /critique-test
│   │   └── train.py         # POST /train, GET /train/{job_id} — 403 정책 차단
│   ├── schemas/             # 요청/응답 계약 (Pydantic)
│   │   ├── base.py          # WireModel — 통신은 camelCase (기획서 7.5장)
│   │   ├── context.py       # Nest가 넘기는 컨텍스트 슬라이스
│   │   ├── infer.py
│   │   ├── summarize.py     # SummarizeResponse = 기획서 13.4장 형태
│   │   └── critique.py
│   └── services/
│       ├── inference.py
│       ├── summarization.py
│       └── critique.py
├── requirements.txt
├── README.md
└── .venv/                   # git 제외
```

**Repository 계층이 없는 것은 의도적이다.** FastAPI는 DB를 직접 보지 않는다 (기획서 §7.4). 자세한 이유는 [../Architecture/layers.md](../Architecture/layers.md) 참고.

**주의:** 응답 모델이 없는 미구현 라우트는 `NoReturn`을 반환하므로 데코레이터에 `response_model=None`이 필요하다. 없으면 FastAPI가 `NoReturn`으로 응답 스키마를 만들려다 기동 자체에 실패한다. 반대로 `response_model`을 명시한 라우트(`/summarize`, `/critique-test`)는 그대로 두면 된다.

`docker-compose.yml`은 아직 없다. 생기면 이 문서를 갱신한다 — 임의로 구조를 정하고 이 문서 갱신을 건너뛰지 않는다.

## 문서와 코드의 관계

| 위치 | 성격 |
|------|------|
| `CodiComperChat_project_plan.md` (루트) | 제품 기획 원본 |
| `docs/plan/` | 원본에서 파생된 개발 스펙 |
| `apps/`, `services/` (예정) | 실제 코드 |

코드가 생기기 전까지 이 파일은 계획서 §7.3의 요약이며, 새 사실을 추가하지 않는다.

관련: [CURRENT_STACK.md](CURRENT_STACK.md), [../Architecture/apps.md](../Architecture/apps.md)
