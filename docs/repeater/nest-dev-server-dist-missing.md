# Nest dev 서버가 `Cannot find module …/dist/main`으로 죽고 다시 안 살아남

## 1. 환경

local — `npm run dev:api`(`nest start --watch`) 실행 중, Windows

## 2. 증상

```text
[AM 12:41:51] Found 0 errors. Watching for file changes.
Error: Cannot find module 'D:\vscode\CodiComperChat\apps\api\dist\main'
```

- 컴파일은 "0 errors"인데 앱 시작에서 죽는다. 웹은 "서버에 연결할 수 없습니다"를 띄운다
- 그 뒤로 소스 파일을 저장해도 **다시 살아나지 않는다**(watch 프로세스는 살아 있지만 4000번이 비어 있음)

## 3. 원인 (2026-09-27 재현으로 확정)

두 가지가 겹쳤다.

1. **발단 — 빌드 두 개가 같은 `dist`를 씀.** dev 서버가 켜진 상태에서 다른 곳에서 `nest build`(`npm run build:api`)를 돌렸다. `nest-cli.json`의 `deleteOutDir: true` 때문에 그 빌드가 `dist`를 통째로 지우고 다시 쓰는 사이에, watch가 `dist/main.js`를 실행하려다 파일이 없어 죽었다. 시각이 맞았다: `dist` 생성 00:41:51, watch 실행 시도 00:41:51, `main.js` 작성 00:41:52.
2. **안 살아난 이유 — 증분 빌드 기록이 `dist` 밖에 있었음.** `tsconfig.json`이 `incremental: true`이고 기록 파일이 `apps/api/tsconfig.build.tsbuildinfo`(dist 밖)에 있었다. `dist`가 지워져도 기록은 남아 TypeScript가 "이미 출력함"으로 믿고 `main.js`를 다시 쓰지 않았다. 파일을 `touch`해도 내용이 같으면 아무것도 출력하지 않는다.

재현(실제 `dist`와 분리된 폴더에서):

| 기록 파일 위치 | 1회차 빌드 | 출력 폴더 삭제 후 2회차 빌드 |
|---|---|---|
| 출력 폴더 **밖** (예전 구조) | `main.js` 있음 | **`main.js` 없음 — 다시 안 씀** |
| 출력 폴더 **안** (수정 후) | `main.js` 있음 | `main.js` 있음 |

## 4. 해결

- `apps/api/tsconfig.build.json`에 `"tsBuildInfoFile": "./dist/tsconfig.build.tsbuildinfo"` — 기록을 `dist` 안에 두어 `dist`가 지워지면 기록도 같이 지워지고 전부 다시 출력한다. 이 설정을 저장한 순간 멈춰 있던 watch가 설정을 다시 읽고 전체를 출력해 스스로 살아났다(00:52:11 저장 → 00:52:13 앱 시작)
- dev 서버가 켜져 있을 때 **`npm run build:api`를 쓰지 않는다.** 대신:
  - 타입만 확인: `npm run typecheck:api` (출력 없음, 증분 기록도 안 씀)
  - 임시 서버로 시험: `npm run build:verify --workspace api` → `dist-verify/`에 따로 빌드, `PORT=4998 node dist-verify/main.js`

### 그래도 멈춰 있으면

터미널에서 `Ctrl+C` 후 `npm run dev:api`를 다시 실행한다. 이미 4000번을 쓰고 있다는 오류가 나면 아래 "같이 겪는 증상"을 본다.

## 5. 검증 명령

```bash
curl -s localhost:4000/health                         # {"status":"ok",...}
ls apps/api/dist/main.js apps/api/dist/tsconfig.build.tsbuildinfo
npm run typecheck:api                                 # dist를 건드리지 않는다
```

## 같이 겪는 증상

| 증상 | 원인 | 조치 |
|------|------|------|
| `listen EADDRINUSE :::4000` | 4000번에 이미 다른 API 프로세스가 떠 있음(예: 백그라운드로 띄운 서버와 터미널 서버가 둘 다 실행) | `Get-NetTCPConnection -LocalPort 4000 -State Listen`으로 주인 PID를 확인하고 하나만 남긴다 |
| 웹에 "서버에 연결할 수 없습니다" | 4000번이 비어 있음(위 두 증상 중 하나) | `curl localhost:4000/health`로 먼저 확인 |
| API는 뜨는데 `PrismaService`에 `character` 없음 등 타입 오류 | Prisma 클라이언트 미생성 | `cd apps/api && npx prisma generate` ([docker-run.md](../guidance/docker-run.md)) |
