# develop into main

| 항목 | 내용 |
|------|------|
| Subject | `merge: develop into main` |
| Full SHA | `70a23cb42b16b266ab52719e82deecaf852922d2` |
| Short SHA | `70a23cb` |
| Branch | `main` |
| Parent | `c1bd630, da47eb3` |
| Date | 2026-11-06 15:51:55 +0900 |

## 주 내용

- `develop`을 `main`에 `--no-ff`로 병합했다

## 상세

**배경**
사용자가 월드코퍼챗·콘솔·문서 작업 뒤 develop → main 순서로 병합하라고 했다(2026-11-06).

**변경 범위**
월드코퍼챗(DB 9테이블·API·AI 진행자·웹 4화면·콘솔 5화면·e2e), 대화 수위, 나레이션·보상 장면 개선, 에이전트 어댑터 7개와 시험, `docs/.assets` 이름 변경, README 월드 화면, docs 전체 갱신.

**기술 포인트**
기록 목록은 `merge=union`으로 충돌 없이 합쳐졌다.

**안 한 것**
`release/*`는 쓰지 않았다. 푸시는 하지 않았다(이번 요청에 없음).

## 결과

**동작 확인**
병합 전 맨 위 브랜치에서 타입 검사(api·web·console), 린트, API 226개, AI 단위 54개, 스크립트 시험 36개, e2e 123개, 성인 끔 e2e 1개 통과. `main`과 `develop`은 내용이 같다.

**리스크**
개발 DB에는 월드 마이그레이션을 아직 적용하지 않았다. GitHub Actions 결과는 확인하지 못했다.

**후속**
`docs/TASKS.md` W01~W05.

**관련 문서**
[WORLD_COPPERCHAT.md](../../plan/WORLD_COPPERCHAT.md)
