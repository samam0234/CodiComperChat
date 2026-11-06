# feature/docs-assets-rename into develop

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/docs-assets-rename into develop` |
| Full SHA | `dfdffd423ed30299770f2176728c58199c78bdd8` |
| Short SHA | `dfdffd4` |
| Branch | `develop` |
| Parent | `bc7793a, 01a16d7` |
| Date | 2026-11-06 15:51:10 +0900 |

## 주 내용

- `feature/docs-assets-rename`를 `develop`에 `--no-ff`로 병합했다

## 상세

**배경**
사용자가 월드코퍼챗·콘솔·문서 작업 뒤 develop → main 순서로 병합하라고 했다(2026-11-06). 앞서 만든 나레이션·보상 장면, 대화 수위, 에이전트 어댑터 브랜치도 같은 줄에 쌓여 있어 함께 병합했다.

**변경 범위**
docs/assets를 docs/.assets로 옮김 작업을 병합한다. 자세한 내용은 해당 브랜치의 커밋 기록을 본다.

**기술 포인트**
브랜치가 쌓인 순서대로 하나씩 병합했다(narration-reward-scene → adult-chat → agent-adapters → world-core → docs-assets-rename → readme-world → docs-overhaul-world). 병합 커밋을 먼저 다 만들고 기록을 남겼다.

**안 한 것**
충돌 해결(충돌 없음).

## 결과

**동작 확인**
병합 전 맨 위 브랜치에서 타입 검사(api·web·console), 린트, API 226개, AI 단위 54개, 스크립트 시험 36개, e2e 123개, 성인 끔 e2e 1개 통과.

**리스크**
개발 DB에는 월드 마이그레이션을 아직 적용하지 않았다(`npx prisma migrate deploy` 필요).

**후속**
`main` 병합.

**관련 문서**
[branch-merge.md](../../guidance/branch-merge.md)
