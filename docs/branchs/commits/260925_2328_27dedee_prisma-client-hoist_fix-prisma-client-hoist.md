# prisma generate가 @prisma/client를 못 찾는 설치 배치 수정

| 항목 | 내용 |
|------|------|
| Subject | `fix(api): prisma generate가 @prisma/client를 못 찾는 설치 배치 수정` |
| Full SHA | `27dedee7fd4d266cf255e8c88642fa4d04d073e3` |
| Short SHA | `27dedee` |
| Branch | `fix/prisma-client-hoist` |
| Parent | `53585b6` (develop) |
| Date | 2026-09-25T23:28:00+09:00 |

## 주 내용

- `package-lock.json`: prisma CLI와 하위 의존성 8개를 `apps/api/node_modules/`에서 루트 `node_modules/`로 이동
- 이동 중 npm이 `std-env` 버전을 다시 계산함 (그 외 버전 변화 없음)
- 코드 변경 없음

## 상세

**배경**
`npm run dev:api`가 `Property 'character' does not exist on type 'PrismaService'` 등으로 컴파일 실패. 원인은 Prisma 클라이언트가 한 번도 생성되지 않은 것이었고, `prisma generate`는 CLI와 클라이언트가 서로 다른 node_modules에 있어 실패했다.

**변경 범위**
루트 `package-lock.json`

**기술 포인트**
Prisma 7 CLI는 `prisma`와 `@prisma/client`의 상대 경로가 형제(`../@prisma/client`)인지 검사한다. 선택적 peer인 TypeScript 버전이 워크스페이스마다 달라 npm이 prisma만 중첩 설치했다. lock 항목을 지우고 재설치해 배치를 새로 계산하게 했다. 로컬에 남아 있던 `apps/api/node_modules/.bin/prisma*` 실행 파일 링크(git 추적 밖)도 지웠다.

**안 한 것**
`docs/guidance/docker-run.md`의 기존 "심볼릭 링크로 해결" 안내는 고치지 않았다(다른 우회책). TypeScript 버전 통일은 하지 않았다.

## 결과

**동작 확인**
`npx prisma generate` 성공, `nest build` 성공, `GET /health` 200.

**리스크**
다른 PC에서 옛 lock으로 설치된 node_modules가 있으면 `npm install`을 다시 해야 한다.

**후속**
없음

**관련 문서**
[docs/guidance/docker-run.md](../../guidance/docker-run.md)
