# fix(e2e): E2E_DATABASE_URL의 데이터베이스 이름을 그대로 만들고 쓰게 고침

| 항목 | 내용 |
|------|------|
| Subject | `fix(e2e): E2E_DATABASE_URL의 데이터베이스 이름을 그대로 만들고 쓰게 고침` |
| Full SHA | `d8265bfb35b31c77fb30d4df1a93febc9815d17b` |
| Short SHA | `d8265bf` |
| Branch | `feature/ci-verify` |
| Parent | `3e89408` (feature/mail-smtp-verify) |
| Date | 2026-10-16T03:15:13+09:00 |

## 주 내용

- `e2e/env.mjs`: 만들고 비울 데이터베이스 이름을 `E2E_DATABASE_URL`의 이름에서 읽음 (예전에는 늘 `codicomperchat_e2e`)
- 이름은 영문·숫자·_만 허용 — `create database`에 그대로 들어가므로

## 상세

**배경**
CI를 깨끗한 클론에서 재현하려고 e2e DB를 다른 이름(codicomperchat_ci_e2e)으로 주자, prepare가 그 이름 대신 codicomperchat_e2e가 있는지 보고 만들었다. 주소의 DB가 없으면 마이그레이션이 실패하는 숨은 버그였다. CI는 우연히 같은 이름을 써서 드러나지 않았다.

**변경 범위**
e2e/env.mjs

**기술 포인트**
- DB 이름을 주소에서 한 번 뽑아 prepare가 쓰게 해, 주소와 실제로 만드는 DB가 어긋날 수 없게 했다.

**안 한 것**
없음

## 결과

**동작 확인**
- 다른 이름의 e2e DB로 깨끗한 클론에서 e2e 45개 통과

**리스크**
없음

**후속**
없음

**관련 문서**
없음
