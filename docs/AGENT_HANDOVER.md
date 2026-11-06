# 에이전트 인수인계

이 저장소의 작업을 이어받는 AI 에이전트(와 사람)를 위한 문서다. **여기부터 읽는다.** 규칙의 정본은 `.agents/skills/codicomperchat/SKILL.md`, 할 일의 정본은 [TASKS.md](TASKS.md)이고, 이 문서는 "지금 어디까지 왔고, 어디서 걸려 넘어지는가"를 적는다. Cursor 등 어떤 도구로 이어받아도 이전 대화는 볼 수 없으니, 합의한 내용은 이 문서들에서 찾는다. 최종 갱신 2026-11-06.

## 1. 한 줄 요약

캐릭터 캠페인 동행 플랫폼. 웹(Next)·콘솔(Next)·API(Nest)·AI(FastAPI) 네 앱이 연결되어 **로컬에서 실제로 동작**하고, 운영 구성(`deploy/`)도 개발 PC에서 끝까지 띄워 확인했다. **실제 서버 배포는 하지 않았다.** 서버 계약(Hetzner GEX45)을 기다린다.

| 항목 | 지금 |
|------|------|
| 배포 | **안 함.** 구성은 있음([DEPLOYMENT.md](DEPLOYMENT.md)). 결정: Hetzner GEX45 한 대, 24시간, 성인 모드는 끈 채로. 계약 전 |
| 병합 | 2026-11-06까지의 작업을 `develop`과 `main`에 병합했다. 미병합 브랜치는 없다 |
| 원격(GitHub) | `develop`과 `main`을 2026-11-06에 푸시했다. 저장소는 그날 확인에서 **공개** 상태였고, 비공개 전환은 사용자가 한다. GitHub Actions 결과는 `gh`가 로그인돼 있지 않아 확인하지 못했다 |
| 로컬 브랜치 | 병합 끝난 브랜치를 2026-11-04에 `git branch -d`로 지웠다. 이름은 병합 커밋과 `docs/branchs/README.md`에 남아 있다 |
| DB | 마이그레이션 33개, 테이블 28개. 개발 DB에 시드까지 적용(이세연 퀘스트 포함) |
| 시험 | 수와 방법은 [plan/TESTING.md](plan/TESTING.md), 실측은 [trainings/](trainings/README.md). 코드 시험은 모두 통과한다. 실제 모델 평가에 기준 미달 항목이 있다([TASKS.md](TASKS.md) 3장) |
| 취약점 | `npm audit --omit=dev` 0건. torch 2건은 영향 없는 경로라 그대로 둠([../SECURITY.md](../SECURITY.md)) |
| PR | `gh`가 로그인돼 있지 않아 PR·저장소 설정을 다루지 못한다 |

## 2. 읽는 순서

1. `.agents/skills/codicomperchat/SKILL.md` — 정본 규칙. **§0 원본 보존: 루트 `CodiComperChat_project_plan.md`는 사용자 승인 없이 수정하지 않는다.**
2. 이 문서
3. [TASKS.md](TASKS.md) — **다음에 할 일**(선행 조건·끝난 기준)
4. [FEATURES.md](FEATURES.md) — **모든 기능의 목록**(화면·API·코드·문서·시험)
5. [plan/CURRENT_STACK.md](plan/CURRENT_STACK.md) — 스택·결정 사항 정본
6. 프롬프트·판정·그림을 고치려면: [trainings/](trainings/README.md)
7. 필요한 것만: [Architecture/overview.md](Architecture/overview.md) · [WORKFLOW.md](WORKFLOW.md)(AI 호출 흐름) · [plan/OPERATIONS.md](plan/OPERATIONS.md) · [plan/SECRET_QUEST.md](plan/SECRET_QUEST.md) · [guidance/photonet-engine.md](guidance/photonet-engine.md) · [../SECURITY.md](../SECURITY.md) · [../THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md)
8. 커밋·병합 전: [guidance/commit-message.md](guidance/commit-message.md) · [guidance/branch-merge.md](guidance/branch-merge.md) · [branchs/TEMPLATE.md](branchs/TEMPLATE.md)

## 3. 작업 약속 (사용자와 합의된 것)

**저장소 규칙**
- 커밋 메시지: `type(scope):`는 영어, 요약·본문·바닥글은 한국어. 바닥글의 `Co-Authored-By` 줄은 쓰는 도구의 안내가 정하는 값을 쓰고, 안내가 없으면 넣지 않는다.
- **매 커밋마다** `docs/branchs/commits/`에 [TEMPLATE.md](branchs/TEMPLATE.md) 형식의 기록 md를 남기고 `docs/branchs/README.md` 목록에 넣는다(생략 금지, 다른 경로 금지). 병합 때는 병합 기록도 남긴다.
- 작업은 **작업별 `feature/*` 브랜치**에서, `develop`/`main`에는 **`git merge --no-ff`만**(FF·force-push 금지). 기능 브랜치 위에 다른 기능을 쌓으면 아래 브랜치를 먼저 병합한다.
- **병합은 사용자가 "병합"이라고 말할 때만, 푸시는 푸시를 요청할 때만** 한다. 병합 후 시험을 돌린 결과를 보고한다.
- v1 범위(기획서 §9.2)를 임의로 넓히지 않는다. 프론트는 FastAPI를 직접 호출하지 않는다(웹 → Nest → FastAPI).
- `.env`·키·DB 비밀번호·`AUTH_SECRET`·SMTP·토스 키 같은 비밀값은 출력·커밋하지 않는다.

**운영 습관**
- 응답은 **한국어, 간결, 결과 중심**. 못 한 것·확인 못 한 것은 숨기지 않고 말한다. 큰 기능은 만들기 전에 방향을 사용자에게 한 번 묻는다(예: 비밀 퀘스트 성격, 성인 확인 방식).
- 사용자의 개발 서버(web·api·ai·console)를 켜거나 끄거나 죽이지 않는다. **내가 켠 것(예: WebUI)만 내가 끈다.**
- **개발 서버가 켜져 있을 때 `npm run build:api`를 하지 않는다**(`dist`를 지워 서버가 죽는다). 타입은 `npm run typecheck:api`, 빌드는 `npm run build:verify --workspace api`.
- 사용자가 "작업 ㄴㄴ"라고 하면 설명만 한다.

## 4. 환경의 함정 (실제로 겪은 것)

| 상황 | 해결 |
|------|------|
| Windows. Bash 도구(Git Bash)와 PowerShell을 오간다 | 경로는 `/d/vscode/...`(Bash) vs `D:\vscode\...`(PowerShell·Read/Edit). 이 문서의 `bash` 예시는 Git Bash에서 돌린다. PowerShell 5.1에서는 `&&`가 안 된다 |
| `apps/web/AGENTS.md`·`console/AGENTS.md`가 `next typegen`이나 e2e로 다시 쓰인다 | 작업과 섞어 커밋하지 말고 `git checkout -- <파일>`로 되돌린다. 안내 내용(새 Next 문서를 먼저 읽기)은 따른다 |
| Git Bash에서 `cmd`로 `.cmd`를 부르면 깨진다 | WebUI는 PowerShell에서 `cmd /c "D:\vscode\CodiComperChat\scripts\start-sd-webui.cmd"`. `.cmd`는 ASCII + CRLF로 둔다 |
| **한글·역슬래시·정규식이 든 `node -e`/python heredoc**이 이스케이프로 깨진다(두 번 실제로 문서·코드를 망가뜨릴 뻔함) | 긴 편집은 Edit/Write 도구를 쓰거나, 스크립트를 파일로 써서 `node 파일`로 돌린다. 편집 뒤 `grep`으로 확인 |
| 파일이 CRLF(`.gitattributes`) | 스크립트로 고칠 땐 `\r\n`→`\n`으로 바꿔 편집하고 되돌려 쓴다 |
| `npx prisma format`이 `schema.prisma` 전체 정렬을 바꿔 diff가 지저분해진다 | 쓰지 않는다. 필요한 줄만 직접 고친다. 마이그레이션은 `migrate diff`로 SQL을 보고 폴더를 만든 뒤 `migrate deploy` |
| `services/` 아래를 재귀 `grep`하면 `.venv`까지 훑어 120초를 넘긴다 | `services/ai/app`만 지정한다 |
| **`services/ai/models/`(수 GB)를 `git add`하면 모델 파일이 올라간다** | `.gitignore`에 들어 있다(develop 기준). 새 브랜치를 낡은 곳에서 따면 빠져 있을 수 있으니 `git check-ignore`로 확인. 한 번 사고 났다(직접 만든 큰 객체만 지우고 `fsck`로 확인) |
| e2e를 돌리면 느려지거나 실패한다 | **그림 엔진(WebUI·GPU 모델)을 끈다**(RAM 16GB). 화면은 운영 빌드로 뜨므로 **화면 코드를 고친 뒤 `E2E_SKIP_BUILD=1`을 쓰면 낡은 빌드를 시험한다**. 전체 e2e는 `npm run test:e2e`(준비 단계가 DB를 비운다). `npx playwright test`를 직접 돌리면 준비가 빠져 이름 충돌이 난다 |
| 시험이 날짜에 기대면 며칠 뒤 깨진다 | 날짜는 "오늘"로(테마 시험을 고친 전례) |
| 실제 모델 확인이 필요한 것을 e2e가 못 잡는다 | 가짜 LLM·가짜 그림은 흐름만 본다. 모델·프롬프트를 바꾸면 실제 gemma로 확인하고 결과를 문서에 남긴다([plan/TESTING.md](plan/TESTING.md) "자동화되지 않은 확인") |
| `docs/branchs/README.md` 목록이 병합 때 충돌한다 | `.gitattributes`의 `merge=union`으로 양쪽 줄을 남긴다(2026-11-04). 쌓인 브랜치를 병합할 때는 병합 커밋을 먼저 다 만들고 기록을 남긴다 |
| 커밋 기록 쓰기 | `node scripts/record-commit.mjs --name <kebab-이름> --notes <본문 파일> --commit --trailer "..."`. 병합 기록은 `--sha`, `--branch develop`. 본문(`## 주 내용`부터)만 직접 쓴다 |
| **명령을 이어 쓰면 시험 실패 뒤에도 커밋까지 간다**(2026-11-03에 실제로 일어나 기록에 거짓 통과를 적었다) | 시험·병합과 커밋을 한 명령으로 묶지 않는다. 결과를 읽은 뒤 다음 명령을 쓴다. 에이전트 도구의 Bash에 넣은 `set -e`는 실패해도 멈추지 않을 수 있다(2026-11-04에 충돌난 병합 위로 기록 커밋이 올라가 로컬에서 되돌렸다). 묶어야 하면 `&&`를 쓰거나 스크립트 파일로 돌린다 |
| **RAM 16GB**: 도커 빌드와 그림 엔진이 겹치면 SDXL 뒤 gemma가 502, 또는 프로세스가 조용히 죽는다 | 실측은 다른 무거운 작업 없이 한다. 파이프로 묶으면 종료 코드가 가려지니 로그 파일에 받고 `$?`를 본다 |
| e2e가 `next dev`일 때 메모리 압박으로 실행마다 다른 시험이 시간 초과했다(2026-11-03) | 2026-11-04에 운영 빌드로 바꿔 없앴다. 다시 실패하면 부하 탓으로 넘기지 말고 결함으로 본다. 시간 제한을 늘려 덮지 않는다. 진행 중 로그의 실패 표시는 `x`이니 `FAIL`로 찾으면 못 잡는다 |
| 사용자의 도커에 다른 프로젝트 컨테이너가 있다(`storyforge-postgres`) | 이 저장소 일이 아니다. `docker system prune`이나 `wsl --shutdown`을 하지 않는다. 내가 만든 이미지·볼륨만 지운다 |

## 5. 검증 명령 (병합·푸시 전)

```bash
npm run typecheck:api
npm run test:api
(cd apps/web && npx next typegen && npx tsc --noEmit)
(cd console && npx next typegen && npx tsc --noEmit)
npx oxlint --deny-warnings apps/api/src apps/web/app apps/web/lib apps/web/components console/app console/lib console/components e2e   # CI와 같은 명령
(cd services/ai && ./.venv/Scripts/python.exe -c "import app.main")
npm run test:e2e                         # 빌드 포함 약 5분. WebUI 끄고
npm run test:e2e:adult-off               # test:e2e 뒤에
node --test scripts/record-commit.test.mjs
(cd services/ai && ./.venv/Scripts/python.exe -m unittest discover tests)
# 모델을 건드렸다면
(cd services/ai && ./.venv/Scripts/python.exe -m evals.run)
(cd services/ai && ./.venv/Scripts/python.exe -m evals.quest_seyeon)   # 퀘스트·판정을 건드렸다면
# 운영 구성을 건드렸다면: web_management/docker-deploy.md "확인"을 다시 한다
```

푸시 전에는 올라갈 범위에 큰 파일·비밀값이 없는지 본다(`git rev-list --objects origin/develop..develop`의 큰 객체, `.env`·`*.safetensors`).

## 6. 결정과 남은 일

작업 목록은 [TASKS.md](TASKS.md)가 정본이다. 여기에는 사용자 결정과 공개 전 체크의 위치만 적는다.

### 6-1. 사용자 결정 기록과 남은 결정

**2026-11-03에 정한 것**

| 항목 | 결정 | 상태 |
|------|------|------|
| GPU 서버 | 배포 사이트에서 24시간 | 구성 완료, Hetzner GEX45로 결정, 계약 전 |
| 병합 (2026-11-04) | 남은 작업을 맡기며 `develop` 다음 `main`까지 병합하라고 함. `release/*` 없이 직접 병합했다 | 완료, 푸시 안 함 |
| 성인 모드 | 기능은 그대로 두고(자기 신고, 그림 가드, 그림 신고), 공개 서버에서는 끈다 | 운영 compose 기본 `ADULT_MODE=off`. Hetzner 약관이 음란물을 금지한다 |
| 프리미엄 모델 | 일단 연동 | 코드 있음(`services/ai/app/services/premium.py`), 기본은 닫힘. 키가 없어 실제 호출 미확인 |
| 저장소 | 비공개로 전환(2026-11-03) | 아직 공개 상태. `gh`가 로그인돼 있지 않아 소유자가 전환한다. 공개였던 동안 받아 간 사본은 되돌릴 수 없다 |
| 결제 | 실제 결제 없이 눌러서 프로 30일(`PRO_CLICK`), 정식 서비스 전 임시 | 완료. 토스 코드는 남겨 두었고 켜면 클릭이 닫힌다 |
| 프리미엄 나이 | 만 18세 미만·생년월일 없음은 잠금 | 완료. 자기 신고라 본인인증은 아니다 |
| 권리자·보안 연락처 | 공개 저장소에 적지 않는다. 신고는 고객센터 | 약관·처리방침의 `[운영자 기재]`는 별개로 남는다 |
| 이세연 퀘스트 | 혼인, 또는 기혼인 채 이어져 충돌 | 완료 |
| 호스팅 | 상시 서버, Hetzner GEX45, 성인 모드 끔 | 구성·설치 스크립트 있음([web_management/hosting-options.md](web_management/hosting-options.md)), 계약 안 함 |

**아직 사용자에게 물어야 할 것**

| 결정 | 왜 |
|------|-----|
| **서버 계약·도메인·운영 메일** | 서버를 만들어야 배포할 수 있다. 비용이 드는 일이라 임의로 하지 않는다 |
| **프리미엄 키와 월 상한 값** | 열면 무료 출석 코레딧이 실제 지출이 된다. 상한은 `PREMIUM_MONTHLY_CREDITS`로 구현했고 값은 사용자가 정한다. 만 18세 미만 차단은 자기 신고 생년월일로 구현했다([plan/AI_MODEL_STRATEGY.md](plan/AI_MODEL_STRATEGY.md)) |
| **성인 모드 공개** | Gemma 4는 Apache 2.0이라 모델 라이선스 문제가 아니었다(2026-11-03 정정). 남은 것은 나이·본인 확인과 음란물 규정, 호스팅 약관이다. 공개 전에 변호사 확인이 필요하다([../THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md)) |
| 결제 재개·가격 | 토스 연동은 있으나 보류 |

### 6-2. 공개 전 필수

[../SECURITY.md](../SECURITY.md) "공개 전 필수" 체크리스트가 정본이다. 2026-11-03 기준 남은 것: 운영 비밀값 발급 · 성인 확인 법률 검토 · 모델 사용 정책 · 처리방침 법률 검토와 보관 기간 · GitHub 설정(`gh` 로그인 필요) · 실제 도메인의 인증서 · 서드파티 라이선스 전체 검토. 배포 전 체크: [web_management/pre-deploy.md](web_management/pre-deploy.md).

### 6-3. 기능·품질 후속

[TASKS.md](TASKS.md)로 옮겼다. 할 일은 거기서만 관리한다.

### 6-4. 문서

- 기능을 바꾸면 [문서 정본 표](README.md#문서-정본-표)대로 고친다. 스택·결정은 [plan/CURRENT_STACK.md](plan/CURRENT_STACK.md)가 먼저.
- `docs/branchs/commits`·`find_debug`·`trainings`는 기록용이라 지금 상태에 맞춰 고치지 않는다.

## 7. 서버 켜기와 점검

```bash
# 사전: PostgreSQL 16(설치형, localhost:5432), Ollama(gemma4:e4b)
npm run dev:api        # :4000
npm run dev:web        # :3000
npm run dev:console    # :3001 (운영자)
cd services/ai && ./.venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8000
curl http://localhost:4000/health ; curl http://localhost:8000/health
curl http://localhost:8000/photonet/status    # 그림 엔진 준비 여부
```

운영자 만들기: 가입 뒤 `npm run user:role --workspace api -- 이메일 admin`. 공식 캐릭터·초상·퀘스트는 `cd apps/api && npm run prisma:seed`(여러 번 돌려도 안전, 운영자가 바꾼 것은 덮지 않는다). 자세히 [guidance/getting-started.md](guidance/getting-started.md).

## 8. 코드 지도 (한 장)

| 알고 싶은 것 | 보는 곳 |
|--------------|---------|
| 대화 한 턴이 어떻게 처리되나 | [WORKFLOW.md](WORKFLOW.md), `apps/api/src/character-chat/` |
| 이야기 상태(요약·친밀도·복선)·퀘스트 판정 반영 | `apps/api/src/campaign-state/`, `apps/api/src/quests/`, `services/ai/app/services/summarization.py` |
| 카드 검증·발행·AI 초상 | `apps/api/src/studio/` |
| 오퍼레이션·코디포토넷·웹툰 | `apps/api/src/operations/`, `services/ai/app/services/{operations,photonet,webtoon}.py` |
| 그림 엔진 | `services/ai/app/services/{image_engine,image_local}.py` |
| 코레딧·모델 조건 | `apps/api/src/credits/`, `apps/api/src/models/` |
| 성인 확인·가드 | `apps/api/src/account/adult.ts`, `services/ai/app/services/{photonet,photonet_moderation}.py` |
| 보안(요청 한도·인증·CSP) | `apps/api/src/{security,auth}/`, `apps/web/proxy.ts` |
| DB | `apps/api/prisma/schema.prisma`, [plan/DATABASE.md](plan/DATABASE.md) |
| 화면 | `apps/web/app/`, [plan/NAVIGATION_IA.md](plan/NAVIGATION_IA.md) |
| 환경변수 | [guidance/environment.md](guidance/environment.md) |
| 운영 구성·배포 | `deploy/`, [DEPLOYMENT.md](DEPLOYMENT.md) |
| 왜 이렇게 정했나, 실제로 재 본 수치 | [trainings/](trainings/README.md) |
| README 그림·영상 다시 만들기 | [`scripts/readme-media/`](../scripts/readme-media/README.md) |
| 그림 신고·계정 정지 | `apps/api/src/content-reports/`, `console/app/content/` |
| 소유자가 직접 할 일 | [guidance/owner-checklist.md](guidance/owner-checklist.md) |

## 9. 이 프로젝트에서 반복해서 맞은 교훈

- **작은 로컬 모델은 지시를 한 번에 다 못 따른다.** 웹툰 콘티는 한 번에 쓰게 하면 태그를 한국어로 쓰고 외모를 섞었다 → 단계를 나눴다. 나레이션은 "필요할 때만"이라고 하면 한 번도 안 썼다 → 역할을 나누고 형식 예시를 주되 베끼지 않게 다른 상황의 예시를 썼다. **프롬프트를 바꾸면 실제 모델로 확인한다.**
- **모델의 확신도 숫자는 믿지 않는다**(모든 항목 "아니오"인데 5점). 항목 판정과 코드 검사(인용 근거 대조, 입력 정규식)로 막는다.
- **안전 규칙은 코드로 강제한다**(성인 여부, 소유, 비밀, 미성년자 설정). 모델 출력에 기대지 않는다.
- **그래픽 메모리는 LLM과 그림 엔진이 나눠 쓴다.** 그림 직전에 LLM을 내린다(`keep_alive 0`).
- **실측 없이 "된다"고 쓰지 않는다.** 확인 못 한 것은 문서에 "미확인"으로 적는다.
- **라이선스는 쓰는 판의 원문을 본다.** "Gemma 금지 정책이 성인 모드를 막는다"고 한동안 적어 두었는데, 그 약관은 Gemma 3n까지만 적용되고 Gemma 4는 Apache 2.0이었다. `ollama show <모델> --license`로 바로 볼 수 있었다.
- **시험이 무작위로 실패하면 시간 제한을 늘리기 전에 원인을 찾는다.** e2e 무작위 실패의 원인은 `next dev`의 첫 컴파일이었고, 운영 빌드로 바꾸니 전부 통과하고 시간도 줄었다([trainings/test-infrastructure.md](trainings/test-infrastructure.md)).
- **모델 평가 8번으로는 개선을 말할 수 없다.** 같은 코드로 보상 장면이 4/8과 2/8이 나왔다. 판정은 시드를 고정해 안정적이고, 연기 쪽 지시가 약하다.
- **넘으면 안 되는 선은 코드로 찾는다.** 성인 장면을 진행하라는 지시를 넣자 강제 장면에서 "저항하다 받아들이는" 답이 나왔다. 미성년자·강제 단서를 코드가 찾아 그 턴을 막자 16/16 거부([trainings/adult-chat.md](trainings/adult-chat.md)). 성인 대화는 로컬 모델에서만 열고 Claude는 우회하지 않는다.
- **연기 모델에게 고르게 하지 말고, 고른 것만 넘긴다.** 보상 장면은 갈래를 판정 쪽(코드가 나누고 모델은 번호만)이 고르자 2/8 → 20/20이 됐다. 나레이션은 괄호 장면 지시가 있는 턴에만 맨 끝에 "첫 줄은 @:"를 붙이자 7/12 → 48/48이 됐다([trainings/narration-and-reward.md](trainings/narration-and-reward.md)).
- **실제로 띄워 봐야 나오는 결함이 있다.** `REQUIRE_HTTPS`는 단위 시험을 통과했지만 내부 호출을 막고 있었고, AI 초상은 시험이 통과하는데 뒷모습이 나왔다. 그림은 눈으로 본다.
