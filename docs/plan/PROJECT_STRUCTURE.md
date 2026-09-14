# 프로젝트 구조 (기획)

정본: `CodiComperChat_project_plan.md` §7.3. 상태: **코드 미착수 — 아래는 목표 구조.**

## 모노레포 최상위

```text
repo/
├── apps/
│   ├── web/          # Next.js (React, TSX) — 유저 화면 + 7단계 공방 UI
│   └── api/           # Nest.js (TypeScript) — 인증/유저/캐릭터/캠페인/세션/상태
├── services/
│   └── ai/            # FastAPI (Python) — 추론(/infer), 요약(/summarize), 공방 테스트(/critique-test)
└── docker-compose.yml
```

각 앱 내부의 세부 폴더 구조(Nest 모듈 분리, FastAPI 라우터 분리 등)는 **아직 정해지지 않았다.** 실제 스캐폴딩이 생기면 이 문서에 갱신한다 — 임의로 구조를 정하고 이 문서 갱신을 건너뛰지 않는다.

## 문서와 코드의 관계

| 위치 | 성격 |
|------|------|
| `CodiComperChat_project_plan.md` (루트) | 제품 기획 원본 |
| `docs/plan/` | 원본에서 파생된 개발 스펙 |
| `apps/`, `services/` (예정) | 실제 코드 |

코드가 생기기 전까지 이 파일은 계획서 §7.3의 요약이며, 새 사실을 추가하지 않는다.

관련: [CURRENT_STACK.md](CURRENT_STACK.md), [../Architecture/apps.md](../Architecture/apps.md)
