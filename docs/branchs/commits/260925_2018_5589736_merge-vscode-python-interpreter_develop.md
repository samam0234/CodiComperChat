# merge: feature/vscode-python-interpreter into develop (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/vscode-python-interpreter into develop (no-ff)` |
| Full SHA | `558973612c3a041b6fb84f171f3309f9f65de452` |
| Short SHA | `5589736` |
| Branch | `develop` |
| Parent | `e473130`, `77826f3` |
| Date | 2026-09-25T20:18:04+09:00 |

## 주 내용

- `feature/vscode-python-interpreter`를 `develop`에 `--no-ff`로 병합
- `.vscode/settings.json` (Python 인터프리터 경로 고정) develop에 반영

## 상세

**배경**
`services/ai` venv를 인식 못 하는 VSCode Pylance 문제 수정을 완료하고 develop에 합류.

**변경 범위**
`.vscode/settings.json`, `docs/branchs/commits/`

**기술 포인트**
표준 병합 절차(`docs/guidance/branch-merge.md`)대로 `--no-ff` 사용, fast-forward 안 함.

**안 한 것**
없음

## 결과

**동작 확인**
`git merge --no-ff` 정상 완료, 충돌 없음

**리스크**
없음

**후속**
없음

**관련 문서**
[docs/guidance/branch-merge.md](../guidance/branch-merge.md)
