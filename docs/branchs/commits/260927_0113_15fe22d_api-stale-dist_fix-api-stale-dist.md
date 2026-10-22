# dev 서버가 dist/main 없음으로 죽고 안 살아나는 빌드 설정 수정

| 항목 | 내용 |
|------|------|
| Subject | `fix(api): dev 서버가 dist/main 없음으로 죽고 안 살아나는 빌드 설정 수정` |
| Full SHA | `15fe22df58d99014088c3072ba8f5eca99def7ee` |
| Short SHA | `15fe22d` |
| Branch | `fix/api-stale-dist` |
| Parent | `69f2b17` (develop) |
| Date | 2026-09-27T01:13:07+09:00 |

## 주 내용

- `apps/api/tsconfig.build.json`: 증분 빌드 기록(`tsBuildInfoFile`)을 `dist` 안으로 이동
- `npm run typecheck:api`(루트) / `typecheck`(apps/api): 출력과 증분 기록 없이 타입만 검사
- `npm run build:verify --workspace api`: `dist-verify/`에 별도 빌드, `.gitignore`에 `dist-verify/` 추가
- `docs/repeater/nest-dev-server-dist-missing.md` 신규, 인덱스에 연결

## 상세

**배경**
병합 직후 제가 검증한다고 `npm run build:api`를 실행했고, 사용자 터미널의 dev 서버(`nest start --watch`)가 `Error: Cannot find module '…\apps\api\dist\main'`으로 죽었다. 사용자가 원인을 확실히 확인하고 제대로 디버깅하라고 요청했다.

**변경 범위**
apps/api(`tsconfig.build.json`, `package.json`), 루트 `package.json`·`.gitignore`, `docs/repeater/`

**기술 포인트**
- 발단: `nest-cli.json`의 `deleteOutDir: true`가 dev 서버와 같은 `dist`를 지운다. 시각으로 확인됨(`dist` 생성 00:41:51 = watch 실행 시도 00:41:51, `main.js` 작성 00:41:52).
- 안 살아난 이유: 기록 파일이 `dist` 밖(`apps/api/tsconfig.build.tsbuildinfo`)에 있어 `dist`가 사라져도 남았고, TypeScript가 변경 없음으로 판단해 `main.js`를 다시 쓰지 않았다. 파일을 `touch`해도 내용이 같으면 출력이 없어 복구되지 않았다.
- 재현(격리 폴더): 기록이 출력 폴더 밖이면 폴더 삭제 후 재빌드에 `main.js` 없음, 안이면 있음.
- `tsconfig.build.json`에 주석을 넣었다(tsc의 JSONC 허용 확인).
- 옛 기록 파일 `apps/api/tsconfig.build.tsbuildinfo`는 git 제외 대상이라 로컬에서만 삭제.

**안 한 것**
- `nest-cli.json`의 `deleteOutDir` 끄기 — 오래된 산출물이 남는 부작용이 더 커서 유지
- dev 서버 자동 복구 스크립트

## 결과

**동작 확인**
- 이 설정을 저장하자 멈춰 있던 watch가 전체를 다시 출력하고 서버가 스스로 살아남(저장 00:52:11 → 앱 시작 00:52:13, `/health` 200).
- `typecheck:api`는 `dist/main.js` 수정 시각이 실행 전후 같음(00:52:12.105)으로 `dist`를 건드리지 않음을 확인.
- `build:verify`로 만든 임시 서버(4998)가 사용자 서버(4000)와 동시에 정상 응답.
- 테스트 35개 통과.

**리스크**
- `dist` 안의 빌드 기록은 `dist`를 직접 지우면 함께 사라진다(의도된 동작).
- 그래도 `build:api`를 dev 서버와 동시에 돌리면 순간적으로 `main.js`가 없어 서버가 죽을 수 있다 — 복구는 이제 자동이지만 방지는 아니므로 `typecheck:api`/`build:verify`를 쓴다.

**후속**
없음

**관련 문서**
[docs/repeater/nest-dev-server-dist-missing.md](../../repeater/nest-dev-server-dist-missing.md)
