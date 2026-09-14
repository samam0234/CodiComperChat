# 브랜치 맵

정본 규칙: `.agents/skills/codicomperchat/SKILL.md` §5, 상세: [../guidance/branch-merge.md](../guidance/branch-merge.md)

```text
main          ← 배포 통합만
└── develop   ← 개발 통합만
      ├── feature/*         # 신규 기능
      ├── bugfix/*          # 버그 수정
      └── experimental/*    # 검증 안 된 실험
```

- 작업·커밋은 `feature/*` 등에서만
- `develop`/`main` 병합은 항상 `git merge --no-ff`
- feature 완료 시 `develop`에 `--no-ff`로 합류, 배포는 `release/*` 검증 후 `main`

로직 단계(§10)를 feature 브랜치로 쪼개는 제안은 [../plan/LOGIC_AND_GIT_BRANCH_STRATEGY.md](../plan/LOGIC_AND_GIT_BRANCH_STRATEGY.md) 참고.

## 현재 상태

이 저장소는 아직 `git init`/최초 커밋 전이다 (또는 커밋 0개). 첫 `feature/*` 브랜치를 실제로 만들기 전에 사용자와 초기화 시점을 맞춘다.
