# 병합 뒤 main 기준으로 배포 안내를 고친다

| 항목 | 내용 |
|------|------|
| Subject | `docs(deploy): 병합 뒤 main 기준으로 배포 안내를 고친다` |
| Full SHA | `f9e425f80bbb3087e466265f4a59a7c6bb40318a` |
| Short SHA | `f9e425f` |
| Branch | `claude/project-thread-pz0x5f` |
| Parent | `58028ce` |
| Date | 2026-11-07 00:08:31 +0000 |

## 주 내용

- 인수인계 md·HTML의 `git fetch`·`git worktree add` 명령을 `origin/main` 기준으로 바꿈
- `deploy-ai-oracle.mjs` 기본 참조에서 PR 브랜치를 뺌

## 상세

**배경**
PR #3이 병합되어 임시 브랜치가 지워질 수 있다. 안내대로 `git fetch origin claude/project-thread-pz0x5f`를 하면 실패한다.

**변경 범위**
docs/web_management, scripts/deploy-ai-oracle.mjs

**안 한 것**
서버 실행, 동작 변경.

## 결과

**동작 확인**
`node --check` 통과. 문서에서 옛 브랜치 이름이 남아 있지 않음을 grep으로 확인.

**리스크**
없음(문서와 기본 참조값만 변경).

**후속**
사용자가 안내대로 배포한 결과를 받아 고친다.

**관련 문서**
docs/web_management/ai-deploy-handover.html
