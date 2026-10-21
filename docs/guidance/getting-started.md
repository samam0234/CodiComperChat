# 시작하기

새 PC에서 세 앱(web·api·ai)을 띄워 가입 → 캐릭터 대화까지 해 보는 순서. 최종 갱신 2026-10-16.

## 전제 조건

| 항목 | 값 | 확인 |
|------|-----|------|
| Node.js / npm | v24 / 11 | `node -v` |
| Python | **3.12** (`services/ai` 전용 venv) | `py -3.12 --version` |
| PostgreSQL | 16, `localhost:5432` | [docker-run.md](docker-run.md) (설치형 또는 compose) |
| Ollama | 설치 + `gemma4:e4b` 받기 | `ollama list` |
| Chrome | 웹 e2e를 돌릴 때만 (설치된 Chrome을 쓴다) | |

## 1) 설치

```bash
# 저장소 루트
npm install

# AI 서비스 (npm workspaces 밖)
cd services/ai
py -3.12 -m venv .venv                                         # Windows (macOS/Linux: python3.12 -m venv .venv)
./.venv/Scripts/python.exe -m pip install -r requirements.txt  # macOS/Linux: ./.venv/bin/python
cd ../..

# 모델
ollama pull gemma4:e4b
```

## 2) 환경변수 (`.env` 두 개)

```bash
cp apps/api/.env.example apps/api/.env
cp services/ai/.env.example services/ai/.env
```

`apps/api/.env`에서 **반드시** 채울 것은 두 개다. 나머지는 비워 두면 코드 기본값으로 돈다(전체 표: [environment.md](environment.md)).

| 키 | 넣을 값 |
|----|---------|
| `DATABASE_URL` | 내 PostgreSQL 주소 (`postgresql://codicomperchat:<비밀번호>@localhost:5432/codicomperchat?schema=public`) |
| `AUTH_SECRET` | 32자 이상 무작위 값: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` — 없으면 api가 시작하지 않는다 |

메일(가입 인증·비밀번호 재설정)을 실제로 주고받아 보려면 로컬 메일 서버를 띄운다 (Docker Desktop 필요):

```bash
docker compose up -d mailpit       # SMTP 127.0.0.1:1025, 받은 메일 http://127.0.0.1:8025
```

그리고 `apps/api/.env`에 `MAIL_SMTP_URL=smtp://127.0.0.1:1025`, `WEB_BASE_URL=http://localhost:3000`. 밖으로는 나가지 않고 Mailpit이 받아 둔다. 확인: `npm run mail:check --workspace api -- 아무주소@example.com`

`.env`는 git에 올라가지 않는다. 값을 문서·대화·커밋에 붙이지 않는다.

## 3) DB 준비

```bash
cd apps/api
npx prisma migrate deploy   # 테이블 만들기 (스키마를 직접 고칠 때는 migrate dev)
npx prisma generate
npm run prisma:seed         # 공식 캐릭터 넣기
cd ../..
```

운영자 계정이 필요하면(운영 콘솔 `http://localhost:3001` — 대시보드·신고함·초상 검수·캐릭터·계정 등급) 가입한 뒤:

```bash
npm run user:role --workspace api -- 내이메일@example.com admin
```

## 4) 실행 (터미널 4개)

```bash
ollama serve                                                     # 이미 떠 있으면 생략
cd services/ai && ./.venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8000
npm run dev:api        # http://localhost:4000
npm run dev:web        # http://localhost:3000
npm run dev:console    # http://localhost:3001  운영 콘솔 (운영자만, 필요할 때)
```

## 기대 결과

| 확인 | 결과 |
|------|------|
| `curl http://localhost:8000/health` | `{"status":"ok","service":"ai",...}` |
| `curl http://localhost:4000/health` | `{"status":"ok","service":"api",...,"ai":{"inFlight":0,...}}` |
| `http://localhost:3000` | 홈(히어로·캐릭터 카드). 오른쪽 위 "시작하기" |
| 가입 → 마이페이지에서 프로필 캐릭터 만들기 → 캐릭터 → 대화 시작하기 | 캐릭터가 답한다(첫 답은 모델을 올리느라 수십 초 걸릴 수 있다) |
| 가입 인증 메일 | Mailpit을 띄웠으면 `http://127.0.0.1:8025`에 도착(링크를 누르면 인증 화면). 메일 설정이 없으면 **api 터미널 로그**에 `[개발용 메일]`과 링크가 찍힌다 |
| 결제 | 토스 키가 없으면 "시험 모드" 가짜 결제창 (돈이 오가지 않음) |

## 테스트

```bash
npm run test:api       # API 단위·통합 (DATABASE_URL이 있으면 실제 DB 시험 포함)
npm run typecheck:api
npm run test:e2e       # 웹 화면 자동 테스트 — 전용 포트·DB·가짜 LLM이라 개발 서버를 켜 둔 채로 된다
npm run ci:local       # CI 단계를 깨끗한 클론에서 재현
```

자세한 것: [../plan/TESTING.md](../plan/TESTING.md).

## 주의

- **개발 서버가 켜져 있을 때 `npm run build:api`를 하지 않는다** — `dist`를 지워 서버가 죽는다. 타입 확인은 `npm run typecheck:api`, 빌드 확인은 `npm run build:verify --workspace api`(별도 폴더) · [../repeater/nest-dev-server-dist-missing.md](../repeater/nest-dev-server-dist-missing.md)
- `.env`를 고치면 그 서버를 다시 켜야 반영된다
- `apps/web/AGENTS.md`·`CLAUDE.md`는 `next dev`가 자동으로 만든다. 손으로 고치지 않는다

관련: [environment.md](environment.md), [operations.md](operations.md), [docker-run.md](docker-run.md), [../plan/CURRENT_STACK.md](../plan/CURRENT_STACK.md)
