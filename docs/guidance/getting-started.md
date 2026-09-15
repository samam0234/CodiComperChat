# 시작하기

현재 세 앱(`apps/web`, `apps/api`, `services/ai`) 모두 실행 가능하다. DB/Redis/Docker는 아직 없고, 앱끼리 연결도 아직 없다. 근거·전체 목표 절차는 [../plan/DEVELOPMENT_AND_DEPLOYMENT_GUIDE.md](../plan/DEVELOPMENT_AND_DEPLOYMENT_GUIDE.md).

## 전제 조건

| 항목 | 값 |
|------|-----|
| Node.js | v24에서 동작 확인 (`engines` 고정은 아직 안 함) |
| npm | 11에서 동작 확인 |
| Python | **3.12** (`services/ai` 전용 venv) |
| 패키지 매니저 | npm workspaces (루트 `package.json`) + `services/ai/requirements.txt` |
| `.env` | 아직 필요 없음 (외부 연동 없음). api 포트만 `PORT`로 덮어쓸 수 있음 |

## 명령

```bash
# 저장소 루트에서 한 번
npm install

# 개발 서버 (각각 별도 터미널)
npm run dev:web        # http://localhost:3000
npm run dev:api        # http://localhost:4000

# 빌드·테스트 확인
npm run build:web
npm run build:api
npm run test:api:e2e
```

`services/ai`는 npm workspaces 밖이라 따로 세팅한다.

```bash
cd services/ai
py -3.12 -m venv .venv                                           # 최초 1회 (Windows)
./.venv/Scripts/python.exe -m pip install -r requirements.txt    # 최초 1회
./.venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8000
```

macOS/Linux는 `python3.12 -m venv .venv`와 `./.venv/bin/python`을 쓴다.

## 기대 결과

**web (3000)**
- 헤더(홈 / 인기 / 에이전트) + 푸터가 보이고, 우측 삼단 줄 버튼으로 드로어가 열린다
- 라우트 11개(`/`, `/popular`, `/agents`, `/library`, `/studio`, `/me`, `/settings`, `/terms`, `/privacy`, `/business`, `/support`)가 모두 200
- 각 화면은 아직 자리표시자다

**api (4000)**
- `curl http://localhost:4000/health` → `{"status":"ok","service":"api","timestamp":...}`
- 나머지 엔드포인트(`/characters`, `/campaigns/...`, `/studio/characters/...`)는 **501**과 한국어 미구현 사유를 돌려준다. 정상이다 — 목록은 [../API_DOCUMENTATION.md](../API_DOCUMENTATION.md)
- 포트를 바꾸려면 `PORT` 환경변수 사용

**ai (8000)**
- `curl http://localhost:8000/health` → `{"status":"ok","service":"ai",...}`
- `http://localhost:8000/docs`에서 대화형 API 문서 확인
- `/infer` `/summarize` `/critique-test`는 **501**, `/train`은 **403**(v1 정책상 의도적 차단)

## 주의

`apps/web/AGENTS.md`와 `apps/web/CLAUDE.md`는 `next dev`가 자동으로 만들고 다시 채워 넣는 파일이다. 손으로 고치지 말고, 변경분이 생기면 그대로 커밋한다.

관련: [docker-run.md](docker-run.md), [../plan/CURRENT_STACK.md](../plan/CURRENT_STACK.md), [../plan/NAVIGATION_IA.md](../plan/NAVIGATION_IA.md)
