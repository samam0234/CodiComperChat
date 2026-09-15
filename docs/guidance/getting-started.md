# 시작하기

현재 실행 가능한 것은 `apps/web`(Next.js)뿐이다. `apps/api`(Nest.js), `services/ai`(FastAPI), DB/Redis는 아직 없다. 근거·전체 목표 절차는 [../plan/DEVELOPMENT_AND_DEPLOYMENT_GUIDE.md](../plan/DEVELOPMENT_AND_DEPLOYMENT_GUIDE.md).

## 전제 조건

| 항목 | 값 |
|------|-----|
| Node.js | v24에서 동작 확인 (`engines` 고정은 아직 안 함) |
| npm | 11에서 동작 확인 |
| 패키지 매니저 | npm workspaces (루트 `package.json`) |
| `.env` | 아직 필요 없음 (외부 연동 없음) |

## 명령

```bash
# 저장소 루트에서 한 번
npm install

# 웹 개발 서버
npm run dev:web        # 또는: npm run dev --workspace web

# 프로덕션 빌드 확인
npm run build:web
```

## 기대 결과

- `http://localhost:3000` 접속 시 헤더(홈 / 인기 / 에이전트) + 푸터가 보이고, 우측 삼단 줄 버튼으로 드로어가 열린다
- 라우트 11개(`/`, `/popular`, `/agents`, `/library`, `/studio`, `/me`, `/settings`, `/terms`, `/privacy`, `/business`, `/support`)가 모두 200
- 각 화면은 아직 자리표시자다

## 주의

`apps/web/AGENTS.md`와 `apps/web/CLAUDE.md`는 `next dev`가 자동으로 만들고 다시 채워 넣는 파일이다. 손으로 고치지 말고, 변경분이 생기면 그대로 커밋한다.

관련: [docker-run.md](docker-run.md), [../plan/CURRENT_STACK.md](../plan/CURRENT_STACK.md), [../plan/NAVIGATION_IA.md](../plan/NAVIGATION_IA.md)
