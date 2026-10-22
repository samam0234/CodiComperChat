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

## 현재 상태 (2026-10-16)

- 원격: `origin` (GitHub). `develop`이 개발 통합, `main`은 초기화 커밋 뒤로 아직 병합 없음(배포 단계에서 `release/*` 검증 후)
- 작업은 기능별 `feature/*`·고침은 `fix/*`에서 하고, 묶음이 끝나면 쌓인 순서대로 `develop`에 `--no-ff`로 병합한 뒤 푸시한다
- 커밋마다 `commits/`에 기록 md, 병합마다 병합 기록 md, 목록은 [README.md](README.md)
- 푸시하면 GitHub Actions CI가 돈다(`.github/workflows/ci.yml`). 같은 단계를 내 PC에서: `npm run ci:local`
