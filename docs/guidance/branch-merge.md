# 브랜치·병합 규칙 (상세)

정본: `.agents/skills/codicomperchat/SKILL.md` §5. 이 문서는 그 상세판이다.

## 브랜치 구조

```text
main          ← 배포 통합만
└── develop   ← 개발 통합만
      ├── feature/*        # 신규 기능
      ├── bugfix/*         # 버그 수정
      └── experimental/*   # 검증 안 된 실험
```

| 필수 | 내용 |
|------|------|
| 작업·커밋 | `feature/*` `bugfix/*` `experimental/*` 에서만 |
| 일자 통합 | `develop` / `main` 만 |
| 병합 방식 | **`git merge --no-ff`** (fast-forward 금지) |
| feature 완료 | `develop`에 `--no-ff`로 합류 |
| 배포 | `release/*`에서 검증 후 `main`으로 |

## 금지 사항

- feature 브랜치끼리 장기간 서로 합치기
- `develop` 없이 `main`에 feature 직행
- 일상적인 기능 작업을 `develop`에 직접 커밋
- fast-forward merge (커밋 그래프가 일자로 뭉개져 이력 추적이 어려워짐)
- force-push (사용자가 명시적으로 요청한 경우 제외)
- `.env` 등 시크릿 파일 커밋

## 표준 병합 절차

```bash
git checkout develop
git pull origin develop
git merge --no-ff feature/xxx -m "merge: feature/xxx into develop (no-ff)"
git push origin develop
```

병합 후에도 `docs/branchs/commits/`에 병합 기록 md를 남긴다 (§ `docs/branchs/TEMPLATE.md`).

## 이 프로젝트가 아직 git 저장소가 아닐 때

`git init` → 초기 커밋 → `develop` 브랜치 생성까지는 사용자 승인 후 진행한다. 저장소를 새로 만드는 것은 되돌리기 쉬운 작업이지만, 브랜치 전략을 실제로 적용하는 시점(첫 feature 브랜치 생성 등)은 사용자와 먼저 맞춘다.

관련: `docs/plan/CURRENT_STACK.md` (모노레포 구조), `docs/branchs/README.md` (커밋 기록 목록)
