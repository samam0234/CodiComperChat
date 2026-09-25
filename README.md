# 코디컴퍼챗 (CodiComperChat)

캐릭터 캠페인 동행 플랫폼. 핵심 기능 **캠페니언(AI Companion)** 은 유저가 주인공인 이어지는 이야기(캠페인)를, 고정된 인격의 AI 캐릭터가 동행하며 다음 세션까지 기억하는 기능이다.

> 제품 기획 원본은 [CodiComperChat_project_plan.md](CodiComperChat_project_plan.md)다. 이 README를 포함한 모든 문서는 원본에서 파생된 것이며, 원본은 사용자 승인 없이 수정하지 않는다.

현재 세 앱 모두 **뼈대 단계**다. 화면과 라우트는 서 있고, 기능은 순차적으로 채워지는 중이다.

---

## 구조 한눈에

```text
CodiComperChat/
├── apps/
│   ├── web/          Next.js 프론트엔드            :3000
│   └── api/          Nest.js 도메인/상태 API       :4000
├── services/
│   └── ai/           FastAPI 추론·요약 엔진         :8000 (내부망 전용)
├── docs/             문서 허브 (기획·아키텍처·Git 기록·가이드)
├── .agents/          AI 에이전트 공통 규칙 정본
├── .claude/ .cursor/ .codex/ .grok/ .antigravity/   도구별 어댑터
├── docker-compose.yml   로컬 PostgreSQL
└── CodiComperChat_project_plan.md   기획 원본
```

호출 방향은 한 방향으로 고정이다.

```text
브라우저 → apps/web → apps/api → services/ai
                         │
                         └→ PostgreSQL (Prisma)
```

**웹은 FastAPI를 직접 호출하지 않는다.** FastAPI는 Nest만 내부망에서 호출한다 (기획서 §7.1).

---

## 각 파트 소개

### `apps/web` — 웹 프론트엔드

Next.js 16 (App Router, React 19, TypeScript, CSS Modules).

유저가 보는 모든 화면을 담당한다. 캐릭터 목록·상세·채팅, 에이전트, 스튜디오, 라이브러리, 설정, 약관 등의 라우트가 `app/` 아래에 있고, 공통 UI(헤더·드로어·푸터)는 `components/`에 있다. `app/api/`는 Nest로 요청을 넘기는 얇은 중계 라우트이며, 무거운 추론은 넣지 않는다.

→ [apps/web/README.md](apps/web/README.md)

### `apps/api` — 도메인/상태 API

Nest.js 12 (TypeScript, **ESM**), Prisma, vitest, oxlint.

캐릭터·캠페인·세션·메시지 같은 도메인 데이터와 상태를 관리하고, 외부(웹)에 공개되는 유일한 백엔드다. DB 접근은 이 앱에만 있다. 모듈은 `src/` 아래 `auth`, `characters`, `campaigns`, `character-chat`, `agent-chat`, `studio`, `health` 등으로 나뉘며, 계층은 Controller → Service → Repository를 따른다.

→ [apps/api/README.md](apps/api/README.md)

### `services/ai` — AI 추론·요약 엔진

FastAPI (Python 3.12). npm workspaces 밖이다.

캐릭터 연기(`/infer`), 세션 요약(`/summarize`), 비평 테스트(`/critique-test`)를 담당한다. DB를 직접 보지 않고, 추론에 필요한 데이터는 Nest가 조립해서 넘긴다 — 그래서 Repository 계층이 **의도적으로 없다**. `/train`은 v1 정책상 403으로 막혀 있다.

```text
app/schemas/    요청·응답 계약 (Pydantic, camelCase 통신)
app/routes/     라우팅과 검증
app/services/   프롬프트 조립·판정 로직
```

→ [services/ai/README.md](services/ai/README.md)

### `docs` — 문서 허브

기획 정책, 아키텍처, 브랜치·커밋 기록, 실행 가이드, 디버그·운영 기록을 폴더별 고정 용도로 모은다.

| 폴더 | 용도 |
|------|------|
| `plan/` | 스택·정책·기획 파생 문서 ([CURRENT_STACK.md](docs/plan/CURRENT_STACK.md)가 스택 정본) |
| `Architecture/` | 시스템 구조·데이터 흐름·계층 |
| `branchs/` | 브랜치 맵과 커밋마다 남기는 기록 |
| `guidance/` | 실행·커밋·병합 가이드 |
| `find_debug/` `repeater/` `vaildates/` `web_management/` | 디버그 일지·장애 지식·검증·운영 |
| `trainings/` | 연구·학습 노트 (코드 아님) |

→ [docs/README.md](docs/README.md)

### `.agents` 및 도구별 어댑터

Claude, Cursor, Codex, Grok, Antigravity 등 AI 에이전트가 공통으로 따르는 규칙의 정본이 [.agents/skills/codicomperchat/SKILL.md](.agents/skills/codicomperchat/SKILL.md)에 있다. `.claude/`, `.cursor/` 같은 도구별 폴더와 루트 [AGENTS.md](AGENTS.md)는 이 정본을 가리키는 어댑터이며, 내용이 어긋나면 정본이 이긴다.

→ [.agents/README.md](.agents/README.md)

---

## 빠른 시작

```bash
# 1) DB
docker compose up -d                # PostgreSQL :5432

# 2) web + api (저장소 루트에서)
npm install
npm run dev:api                     # http://localhost:4000
npm run dev:web                     # http://localhost:3000

# 3) ai (별도 터미널)
cd services/ai
py -3.12 -m venv .venv                                        # 최초 1회
./.venv/Scripts/python.exe -m pip install -r requirements.txt # 최초 1회
./.venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8000
```

자세한 절차: [docs/guidance/getting-started.md](docs/guidance/getting-started.md), [docs/guidance/docker-run.md](docs/guidance/docker-run.md)

> VSCode에서 `fastapi` import 경고가 뜨면 `Python: Select Interpreter`로 `services/ai/.venv`를 선택한다. 저장소의 `.vscode/settings.json`이 기본값으로 이 경로를 지정한다.

---

## 작업 규칙 요약

- 커밋: `type(scope):`는 영어, 요약·본문은 한국어 → [commit-message.md](docs/guidance/commit-message.md)
- 매 커밋마다 `docs/branchs/commits/`에 기록 → [TEMPLATE.md](docs/branchs/TEMPLATE.md)
- 작업은 `feature/*`에서, `develop`/`main` 병합은 `--no-ff`만 → [branch-merge.md](docs/guidance/branch-merge.md)
- v1 범위(기획서 §9.2)를 임의로 넓히지 않는다
