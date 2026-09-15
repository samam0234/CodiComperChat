# 코디컴퍼챗(CodiComperChat) 에이전트 협업 스킬 — 정본

이 문서는 모든 AI 에이전트(Claude, Grok, Cursor, Codex, Antigravity 등)가 이 저장소에서 작업할 때 따라야 하는 **정본 규칙**이다.
도구별 어댑터(`.claude/`, `.cursor/`, `.codex/`, `.grok/`, `.antigravity/` 등)는 이 문서를 요약·복제한 것이며, 내용이 어긋나면 **이 문서가 이긴다.**

---

## 0. 원본 보존 원칙 (최상위, 예외 없음)

- 루트의 `CodiComperChat_project_plan.md`는 이 프로젝트의 **기획 원본**이다. 대화로 합의된 제품 정의·차별점·컨텐츠 구조·기술 구조·v1 범위가 여기 담겨 있다.
- 에이전트는 이 문서의 **설계 의도, 문단 구조, 워딩, 예시(캐릭터 "린" 등)를 임의로 수정·삭제·재작성·요약 대체하지 않는다.** 오타 수정 같은 사소한 교정도 사용자 확인 없이 하지 않는다.
- 이 원본과 충돌하는 결정이 필요하면:
  1. 먼저 사용자에게 확인한다 (말없이 진행 금지).
  2. 승인되면 기존 문단을 조용히 지우는 대신, 문서 상단 `문서 버전`을 올리고 변경 이력을 남기거나, 해당 절 아래에 갱신 내용을 추가하는 방식으로만 반영한다.
- 이 원칙은 캐릭터 카드 예시, 화면 지도, API 계약처럼 이 문서에서 파생되는 다른 기획/디자인 산출물에도 동일하게 적용된다 — 사용자가 명시적으로 요청한 범위만 고치고, 나머지 구조·워딩·디자인은 그대로 둔다.
- 이 원칙은 아래 어떤 규칙(브랜치, 커밋, docs 구조)과 충돌하더라도 **항상 우선한다.**

---

## 1. 정본 우선순위 (충돌 시)

1. `CodiComperChat_project_plan.md` (루트) ← **제품/기획 원본. §0 원칙 적용**
2. `.agents/skills/codicomperchat/SKILL.md` ← **이 문서. 에이전트 작업 방식 정본**
3. 루트 `AGENTS.md` ← 에이전트 자동 로드 요약
4. `docs/guidance/commit-message.md` ← 커밋 메시지 상세
5. `docs/guidance/branch-merge.md` ← 브랜치·병합 상세
6. `docs/branchs/TEMPLATE.md` ← 커밋 기록 md 템플릿
7. 도구별 어댑터 (`.grok/`, `.claude/`, `.cursor/`, `.codex/`, `.antigravity/` …) ← 정본을 가리키는 복제

---

## 2. 에이전트 규칙 파일 맵

### 정본·공통

| 경로 | 용도 |
|------|------|
| `.agents/skills/codicomperchat/SKILL.md` | 정본 스킬 (이 문서) |
| `.agents/AGENTS.md` | 짧은 진입 지시 |
| `.agents/README.md` | 스킬 허브 설명 |
| `AGENTS.md` (루트) | Grok/Codex 등 자동 로드용 요약 |

**주의:** 스킬 파일은 반드시 `.agents/skills/codicomperchat/SKILL.md` 경로에 둔다. `.agents/SKILL.md`처럼 루트에 바로 두면 일부 도구가 찾지 못한다.

### 도구별 어댑터

- `.grok/skills/codicomperchat/SKILL.md`, `.grok/rules/codicomperchat.md`
- `.claude/CLAUDE.md`, `.claude/skills/codicomperchat/SKILL.md`
- `.cursor/rules/codicomperchat.mdc`, `.cursor/skills/codicomperchat/SKILL.md`
- `.codex/AGENTS.md`, `.codex/skills/codicomperchat/SKILL.md`
- `.antigravity/AGENTS.md`

### 도구가 자동 생성하는 파일 (우리 규칙 아님, 손대지 말 것)

| 경로 | 생성 주체 | 성격 |
|------|-----------|------|
| `apps/web/AGENTS.md`, `apps/web/CLAUDE.md` | `next dev` (Next.js 16) | 해당 Next 버전의 주의사항 안내. 지우면 다시 생성되므로 변경분은 그대로 커밋한다 |

이 파일들은 **작업 방식(커밋/브랜치/문서) 규칙이 아니다.** 프레임워크 사용법만 다루므로 이 정본과 충돌하지 않으며, 충돌하는 것처럼 보이면 이 정본이 이긴다. 손으로 고치지 않는다.

규칙을 고칠 때는 **정본(이 문서) + 루트 `AGENTS.md`를 먼저** 수정하고, 어댑터들은 그에 맞춰 동기화한다.

에이전트가 커밋 전에 열어야 할 문서 순서: 이 스킬 → `commit-message.md` → `branch-merge.md` → `TEMPLATE.md` → (백엔드/AI 작업이면) `docs/plan/CURRENT_STACK.md` → 관련 API/도메인 문서

---

## 3. 커밋 메시지 규칙 (필수)

| 구간 | 언어 |
|------|------|
| type / scope | **영어** (`feat`, `fix`, `docs` …) |
| 제목 요약 | **한국어** |
| 본문 | **한국어** |
| 바닥글 | **한국어** |

형식:
```text
type(scope): 한국어 한 줄 요약

한국어 본문 (무엇을·왜)

관련: …
후속: …
```

- type 예: `feat` `fix` `docs` `chore` `refactor` `test` `perf` `ci` `style` `build`
- scope 예: `web` `api` `ai` `db` `prisma` `docs` `branchs` `docker` `infra`
- 제목 끝 마침표 금지
- `type(scope):` 뒤 한 칸
- ✅ `feat(api): 캠페인 상태 갱신 엔드포인트 추가`
- ❌ `feat(ai): add summarize endpoint` (요약 영어 금지)
- ❌ `작업함` / type 없는 한 줄
- 병합 메시지 관례: `merge: feature/xxx into develop (no-ff)`

상세: `docs/guidance/commit-message.md`

---

## 4. 커밋 기록 md (필수 · 예외 없음)

커밋 메시지와 **별개로** 남긴다. **생략 금지.** merge·작은 수정도 생략 금지.

| 항목 | 규칙 |
|------|------|
| 경로 | **`docs/branchs/commits/` 만** |
| 금지 | `docs/commits/` · 다른 폴더 · "나중에/푸시만" |
| 시점 | 커밋 **전 또는 직후** |
| 템플릿 | `docs/branchs/TEMPLATE.md` |
| 목록 | `docs/branchs/README.md` 표에도 링크 추가 |
| 기록 파일 | 같은 브랜치에 커밋·푸시 |

파일명:
```text
YYMMDD_HHMM_[커밋ID]_[커밋이름]_[커밋브랜치].md
```
예: `260915_1420_a1b2c3d_campaign-state-api_feature-api.md`

- `YYMMDD` = 연2+월+일 (구분자 없음)
- `HHMM` = 시분 **한 덩어리** (중간에 `_` 넣지 않음)
- 커밋이름 = kebab-case, 공백/`/` 금지
- 브랜치 `/` → `-` (`feature/api` → `feature-api`)
- 시각은 `git log -1 --format=%ci` 권장

본문 필수 섹션은 `docs/branchs/TEMPLATE.md` 참고 (제목/커밋번호 · 주 내용 · 상세 · 결과).

---

## 5. 브랜치·병합 규칙 (필수)

```text
main          ← 배포 통합만
└── develop   ← 개발 통합만
      ├── feature/*
      ├── bugfix/*
      └── experimental/*
```

| 필수 | 내용 |
|------|------|
| 작업·커밋 | `feature/*` 등에서만 |
| 일자 통합 | develop / main 만 |
| 병합 | **`git merge --no-ff`** (FF 금지) |
| feature 완료 | develop에 --no-ff |
| 배포 | release/* 검증 후 main |

금지:
- feature끼리 장기 합치기
- develop 없이 main에 feature 직행
- 일상 기능을 develop에 직접 커밋
- FF merge (그래프가 일자로 뭉개짐)
- force-push (명시 요청 제외)
- `.env` 시크릿 커밋

```bash
git checkout develop
git pull origin develop
git merge --no-ff feature/xxx -m "merge: feature/xxx into develop (no-ff)"
git push origin develop
```

상세: `docs/guidance/branch-merge.md`

---

## 6. 프로젝트/스택 규칙 (에이전트도 준수)

**출처: `CodiComperChat_project_plan.md` §7, §9, §13 그대로. 임의로 스택을 바꾸거나 범위를 넓히지 않는다.**

- 프론트: **Next.js (React, TSX)** — `apps/web/`
- 도메인/상태 API: **Nest.js (TypeScript)** — `apps/api/`
- AI 추론: **FastAPI (Python)** — `services/ai/`
- DB: **PostgreSQL** (1순위), 의미 검색은 pgvector 또는 이후 전용 벡터DB, 세션 캐시/잡은 **Redis**
- ORM: Nest 쪽 **Prisma**

저장소 구조 (계획서 7.3):
```text
repo/
├── apps/
│   ├── web/          # Next.js (TSX)
│   └── api/          # Nest.js
├── services/
│   └── ai/           # FastAPI
└── docker-compose.yml
```

역할 분리 원칙 (계획서 7.1, 위반 금지):
- 프론트는 FastAPI를 직접 호출하지 않는다
- FastAPI는 내부망에서만 Nest가 호출한다
- 학습 API(`/train`)는 외부에 열지 않는다 (v1에서는 경로만 두고 막아 둔다)
- Next.js Route에 무거운 추론을 넣지 않는다 (타임아웃·메모리)

API 경계 (계획서 13.1, 13.2) — 웹이 치는 것과 내부 전용을 섞지 않는다:
- Nest가 밖으로 여는 것: `/auth/*`, `/characters`, `/campaigns`, `/campaigns/:id/messages`, `/campaigns/:id/sessions/:sid/close`, `/campaigns/:id/logbook`, `/studio/*` 등
- FastAPI가 안으로만 여는 것: `/infer`, `/summarize`, `/critique-test`, `/train` — **웹이 `/infer`를 직접 알아서는 안 된다.**

핵심 도메인 (계획서 7.5, 테이블명 확정은 Prisma 단계에서): `User` `Character` `LoreEntry` `Campaign` `CampaignState` `Session` `Message` `MemoryChunk`

v1 범위 (계획서 §9, 에이전트가 임의로 확장 구현하지 않는다):
- 있음: 공식 캐릭터 1~3명, 캠페인 템플릿 1개, 7단계 창작 공방(운영자용)
- 없음(명시적으로 뺌): 유저 캐릭터 광장/카드 마켓, 자체 LLM 학습, 멀티플레이/파티 채팅, 음성 통화·만화 자동생성, 일정/할일/검색류 생산성 기능, 복잡한 전투 룰북

포트/인프라 확정값은 아직 계획서에 없음 → 제안값과 확정 여부는 `docs/plan/CURRENT_STACK.md`에서 관리. 이 문서를 고치지 않고 코드에서만 포트를 정하지 않는다.

---

## 7. docs/ 폴더 체계와 작성 규칙

진입점: `docs/README.md`

| 폴더 | 용도 | 작성 규칙 |
|------|------|-----------|
| `plan/` | 스택 스냅샷·DB·테스트·API 계약 등 기획서에서 파생된 개발 스펙 | `CodiComperChat_project_plan.md`와 모순되면 원본이 우선, 여기서 수정 |
| `Architecture/` | 시스템·계층·데이터흐름·배포 구조 | 구현이 바뀌면 여기 먼저 갱신, ASCII/mermaid 권장 |
| `branchs/` | 브랜치·커밋 기록 | `commits/` + `TEMPLATE.md` + `README.md` 목록 필수 |
| `guidance/` | 실행·기능 가이드 | 전제 → 명령 → 기대결과, 포트/ENV는 표로 |
| `find_debug/` | 날짜별 디버그 일지 | `YYYY-MM-DD.md`, 증상/원인/해결/재발방지 |
| `repeater/` | 재발 가능한 인프라 이슈 지식 | 환경/증상/원인/해결/검증 명령 |
| `vaildates/` | 배포·데모 전 수동 검증 체크리스트 | 폴더명 스펠링 `vaildates` 의도적 유지, 교정 금지 |
| `web_management/` | 배포 전/중/후, 포트 인벤토리 | pre-deploy / docker-deploy / ports-inventory / post-deploy |
| `trainings/` | 설계 판단·연구 노트 (코드 아님) | 코드가 아니라 "왜 이렇게 정했는지"만. 캐릭터 카드 원문·실 유저 데이터 금지 |

새 하위 폴더가 더 필요해지면 이 표에 추가하고 용도를 적는다 — 말없이 폴더만 만들지 않는다.

### docs에서 절대 하지 말 것
- `docs/commits/`에 기록 (금지) → `docs/branchs/commits/`만
- 커밋 기록 생략
- 구현을 바꾸면서 `Architecture/`나 `docs/plan/CURRENT_STACK.md`를 갱신하지 않음
- 루트 `CodiComperChat_project_plan.md`를 `docs/` 안으로 옮기거나 이름을 바꿈 (원본 위치 보존, §0 참고)

---

## 8. 한 줄 요약

1. **§0 원본 보존 원칙이 항상 최우선** — 기획 원본은 사용자 승인 없이 건드리지 않는다
2. **에이전트 정본 스킬 하나**(이 문서) + 도구별 어댑터는 그걸 가리키게
3. **커밋:** type/scope 영어, **요약·본문·바닥글 한국어**
4. **매 커밋마다** `docs/branchs/commits/`에 템플릿 md + 목록 표 갱신 (생략 금지, 잘못된 경로 금지)
5. **작업은 feature**, **합칠 때만 develop/main + `--no-ff`**
6. **스택·범위는 기획서 §7~9 그대로**, 임의로 프레임워크를 바꾸거나 v1 범위를 넓히지 않는다
7. 시크릿·force-push 금지
