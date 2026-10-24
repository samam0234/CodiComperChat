# 코디컴퍼챗 (CodiComperChat)

캐릭터 캠페인 동행 플랫폼. 핵심 기능 **캠페니언(AI Companion)** 은 유저가 주인공인 이어지는 이야기(캠페인)를, 고정된 인격의 AI 캐릭터가 동행하며 다음 세션까지 기억하는 기능이다.

> 제품 기획 원본은 [CodiComperChat_project_plan.md](CodiComperChat_project_plan.md)다. 이 README를 포함한 모든 문서는 원본에서 파생된 것이며, 원본은 사용자 승인 없이 수정하지 않는다.

**상태(2026-10-24): 개발 단계, 배포 전.** 네 앱(웹·콘솔·API·AI)이 연결되어 실제로 동작한다. 공개 서비스가 되기 전에 끝내야 할 일은 [SECURITY.md](SECURITY.md)의 "공개 전 필수"와 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)의 모델 라이선스 확인이다.

[LICENSE](LICENSE)(독점, 모든 권리 보유) · [SECURITY.md](SECURITY.md)(취약점 신고·구현된 보안·공개 전 필수) · [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)(오픈소스·AI 모델 고지)

---

## 지금 되는 것

| 영역 | 내용 |
|------|------|
| 계정 | 이메일 가입·로그인, 이메일 인증, 비밀번호 찾기, 회원 탈퇴, 요금 등급(무료/프로), 코레딧·출석 |
| 대화 | 캐릭터와 이어지는 대화(기억·지난 이야기·친밀도·복선·엑스트라), 새로하기·이어하기·저장, 대답 추천, 모델 고르기, 대화 명령어와 글 꾸미기(`*행동*` 회색 기울임, `@:` 나레이션 등) |
| 캐릭터 공방 | 7단계 카드 + 비밀 퀘스트 단계, 칸별 AI 초안, 3턴 테스트, 초상 업로드와 자동 검수, 공개·링크 공개·비공개 발행 |
| 오퍼레이션 | 심리 탐구 · 일기 · 메시지 · 커뮤니티 · **웹툰**(콘티 무료, 한 컷 45 코레딧) |
| 코디포토넷 | 대화 장면을 그림으로. 로컬 Stable Diffusion, 전체 이용가 / **성인 모드**(성인 확인·가드·검수) |
| 비밀 퀘스트 | 친밀도가 쌓이면 캐릭터가 건네는 숨은 부탁, 엄격 판정, 공방에서 직접 쓰거나 AI로 제작 |
| 운영 | 별도 운영 콘솔(신고·초상 검수·캐릭터·계정 등급), 요청 한도, CSP, 신고 |

보류: 결제(토스페이먼츠 연동은 있으나 열지 않음). 아직 없음: 스트리밍 응답, 성인 콘텐츠 운영 체계, 본인인증.

---

## 구조 한눈에

```text
CodiComperChat/
├── apps/
│   ├── web/          Next.js 이용자 사이트          :3000
│   └── api/          Nest.js 도메인/상태 API        :4000
├── console/          Next.js 운영자 콘솔            :3001
├── services/
│   └── ai/           FastAPI 추론·그림 엔진          :8000 (내부망 전용)
├── e2e/              Playwright 화면 자동 테스트
├── scripts/          그림 엔진(WebUI) 실행·로컬 CI
├── docs/             문서 허브 (기획·아키텍처·Git 기록·가이드)
├── .agents/          AI 에이전트 공통 규칙 정본
├── .claude/ .cursor/ .codex/ .grok/ .antigravity/   도구별 어댑터
├── docker-compose.yml   (선택) PostgreSQL·Mailpit
├── LICENSE  SECURITY.md  THIRD_PARTY_NOTICES.md
└── CodiComperChat_project_plan.md   기획 원본
```

호출 방향은 한 방향으로 고정이다.

```text
브라우저 → apps/web ─┐
          console ───┴→ apps/api → services/ai → Ollama (gemma4:e4b)
                          │                  └→ 그림 엔진 (diffusers, 같은 프로세스)
                          └→ PostgreSQL (Prisma)
```

**웹은 FastAPI를 직접 호출하지 않는다.** FastAPI는 Nest만 내부망에서 호출한다 (기획서 §7.1). Redis는 쓰지 않는다.

---

## 각 파트 소개

### `apps/web` — 이용자 사이트

Next.js 16 (App Router, React 19, TypeScript, CSS Modules). 화면 31개: 홈·인기·캐릭터 상세·채팅·오퍼레이션 5종·공방·대화 목록·마이페이지·설정·요금·약관 등. 엄격한 CSP(요청마다 nonce), 라이트·다크 테마(한국 시각 자동 전환). `app/api/`는 초상·그림 중계와 CSP 보고 받기뿐이며 무거운 추론은 넣지 않는다.

→ [apps/web/README.md](apps/web/README.md)

### `console` — 운영자 콘솔

별도 Next.js 앱. 운영자만 로그인하고(`console_session`), 대시보드·신고함·초상 검수·캐릭터·계정 등급을 다룬다. 바깥에 열지 않는다(사내망·VPN).

→ [console/README.md](console/README.md)

### `apps/api` — 도메인/상태 API

Nest.js 12 (TypeScript, **ESM**), Prisma 7, vitest, oxlint. 외부에 공개되는 유일한 백엔드이고 **신뢰 경계**다. DB 접근은 여기에만 있다. 모듈 24개(인증·계정·캐릭터·대화·기억·공방·신고·결제·코레딧·모델·오퍼레이션·퀘스트 등), 테이블 27개.

→ [apps/api/README.md](apps/api/README.md)

### `services/ai` — AI 추론·그림 엔진

FastAPI (Python 3.12). npm workspaces 밖이다. 캐릭터 연기·요약·기억·판정·AI 초안·초상 검수·오퍼레이션 5종·코디포토넷·웹툰을 담당한다. DB를 직접 보지 않고 Nest가 조립해 넘긴 맥락만 쓴다 — 그래서 Repository 계층이 **의도적으로 없다**. `/train`은 v1 정책상 403이다.

그림은 이 프로세스 안에서 diffusers로 직접 그린다(`IMAGE_ENGINE=local`, 선택 설치 `requirements-image.txt`). 개발 PC에서는 기존 Stable Diffusion WebUI(`IMAGE_ENGINE=webui`)도 쓸 수 있다.

→ [services/ai/README.md](services/ai/README.md)

### `docs` — 문서 허브

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

필요한 것: Node 24, Python 3.12, PostgreSQL 16, [Ollama](https://ollama.com)(`gemma4:e4b`). 그림 기능은 NVIDIA GPU(12GB 권장)가 있어야 한다 — 없으면 코디포토넷·웹툰만 "준비 중"으로 잠기고 나머지는 그대로 돈다.

```bash
# 1) DB — 로컬 PostgreSQL 16 (설치·초기 설정: docs/guidance/docker-run.md)
#    개발 메일은 `docker compose up -d mailpit` (선택)

# 2) web + api + console (저장소 루트에서)
npm install
cp apps/api/.env.example apps/api/.env     # AUTH_SECRET 등을 채운다
(cd apps/api && npx prisma migrate deploy && npm run prisma:seed)   # 테이블 만들기 + 공식 캐릭터(유지성)
npm run dev:api                            # http://localhost:4000
npm run dev:web                            # http://localhost:3000
npm run dev:console                        # http://localhost:3001 (운영자)

# 3) ai (별도 터미널)
cd services/ai
py -3.12 -m venv .venv                                         # 최초 1회
./.venv/Scripts/python.exe -m pip install -r requirements.txt  # 최초 1회
cp .env.example .env
./.venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8000

# 4) (선택) 그림 엔진 — 코디포토넷·웹툰
./.venv/Scripts/python.exe -m pip install -r requirements-image.txt
#    체크포인트 두 개를 services/ai/models/ 에 둔다 (services/ai/README.md)
```

자세한 절차: [docs/guidance/getting-started.md](docs/guidance/getting-started.md) · 환경변수: [docs/guidance/environment.md](docs/guidance/environment.md) · 그림 엔진: [docs/guidance/photonet-engine.md](docs/guidance/photonet-engine.md)

> VSCode에서 `fastapi` import 경고가 뜨면 `Python: Select Interpreter`로 `services/ai/.venv`를 선택한다. 저장소의 `.vscode/settings.json`이 기본값으로 이 경로를 지정한다.

## 테스트

```bash
npm run test:api          # API 단위·통합 (vitest, 실제 PostgreSQL)
npm run typecheck:api
npm run test:e2e          # 웹 화면 자동 테스트 (Playwright, 가짜 LLM·가짜 그림 엔진)
npm run ci:local          # GitHub Actions와 같은 단계를 내 PC에서
```

e2e를 돌릴 때는 개발용 그림 엔진(WebUI)을 꺼 두는 편이 안전하다(메모리). 설명: [docs/plan/TESTING.md](docs/plan/TESTING.md)

---

## 작업 규칙 요약

- 커밋: `type(scope):`는 영어, 요약·본문은 한국어 → [commit-message.md](docs/guidance/commit-message.md)
- 매 커밋마다 `docs/branchs/commits/`에 기록 → [TEMPLATE.md](docs/branchs/TEMPLATE.md)
- 작업은 `feature/*`에서, `develop`/`main` 병합은 `--no-ff`만 → [branch-merge.md](docs/guidance/branch-merge.md)
- v1 범위(기획서 §9.2)를 임의로 넓히지 않는다
- 비밀값(`.env`, 키, 모델 파일)은 커밋하지 않는다 → [SECURITY.md](SECURITY.md)
