# CI 단계를 깨끗한 클론에서 재현하는 npm run ci:local 추가

| 항목 | 내용 |
|------|------|
| Subject | `ci(infra): CI 단계를 깨끗한 클론에서 재현하는 npm run ci:local 추가` |
| Full SHA | `599d41764af1a52cea6faa032f031f78f1804b43` |
| Short SHA | `599d417` |
| Branch | `feature/ci-verify` |
| Parent | `541e78b` (feature/ci-verify) |
| Date | 2026-10-16T03:25:47+09:00 |

## 주 내용

- `scripts/ci-local.mjs` + `npm run ci:local [-- checks|e2e]`: 지금 커밋을 `e2e/.tmp/ci-clone`에 클론해 `.github/workflows/ci.yml`과 같은 단계를 실행
- DB는 개발 DB 서버의 `codicomperchat_ci`·`codicomperchat_ci_e2e`를 매번 새로 만들어 씀(개발 DB 그대로), 접속 정보는 출력하지 않음
- 개발 PC의 DB·키·한도·메일·결제 환경변수는 넘기지 않음(CI처럼), 실패 로그는 `e2e/.tmp/ci-logs`
- docs/plan/TESTING.md에 사용법

## 상세

**배경**
사용자 요청("확인하지 못했거나 할 수 없는 것을 진행"). 저장소가 비공개라 GitHub Actions 첫 실행 결과를 여기서 볼 수 없었다. 같은 단계를 깨끗한 환경에서 돌려 "내 PC에서만 되는" 곳을 찾는다.

**변경 범위**
scripts/ci-local.mjs(신규), package.json, docs/plan/TESTING.md

**기술 포인트**
- 재현에서 숨은 문제 두 개를 찾아 고쳤다: e2e DB 이름이 주소와 어긋나던 것(d8265bf), 빈 RATE_LIMIT_SCALE이 한도 1배로 돌던 것(541e78b).
- 실제 GitHub 러너(우분투)와의 차이는 남는다: 경로(.venv/bin)·Chrome 설치는 워크플로가 이미 우분투 기준으로 적혀 있고, 이 도구는 플랫폼에 맞는 경로를 쓴다.

**안 한 것**
GitHub Actions의 실제 실행 결과 확인(비공개 저장소라 인증이 필요하다)

## 결과

**동작 확인**
- `npm run ci:local` 9/9 단계 통과: npm ci, Prisma 생성·마이그레이션, oxlint --deny-warnings, 타입 검사(api·web), API 단위 테스트, AI 서비스 불러오기, Prisma 생성, 웹 e2e 45개

**리스크**
실행할 때마다 codicomperchat_ci* 데이터베이스를 지우고 새로 만든다(이름이 정해져 있어 다른 DB에는 영향 없음).

**후속**
GitHub Actions 탭에서 첫 실행 확인

**관련 문서**
[docs/plan/TESTING.md](../../plan/TESTING.md)
