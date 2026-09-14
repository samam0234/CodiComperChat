# 프로젝트 구조 (기획)

정본: `CodiComperChat_project_plan.md` §7.3. 상태: **`apps/web`만 구현 시작, 나머지는 목표 구조.**

## 모노레포 최상위

```text
repo/
├── package.json       # npm workspaces 루트 (workspaces: ["apps/*"])
├── apps/
│   ├── web/           # Next.js (React, TSX) — 구현 시작됨
│   └── api/           # Nest.js (TypeScript) — 미착수
├── services/
│   └── ai/            # FastAPI (Python) — 미착수. 워크스페이스 밖(Python)
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

`apps/api`(Nest 모듈 분리)와 `services/ai`(FastAPI 라우터 분리)의 내부 구조는 **아직 정해지지 않았다.** 스캐폴딩이 생기면 이 문서를 갱신한다 — 임의로 구조를 정하고 이 문서 갱신을 건너뛰지 않는다.

## 문서와 코드의 관계

| 위치 | 성격 |
|------|------|
| `CodiComperChat_project_plan.md` (루트) | 제품 기획 원본 |
| `docs/plan/` | 원본에서 파생된 개발 스펙 |
| `apps/`, `services/` (예정) | 실제 코드 |

코드가 생기기 전까지 이 파일은 계획서 §7.3의 요약이며, 새 사실을 추가하지 않는다.

관련: [CURRENT_STACK.md](CURRENT_STACK.md), [../Architecture/apps.md](../Architecture/apps.md)
