# docs/assets를 docs/.assets로 옮김

| 항목 | 내용 |
|------|------|
| Subject | `docs(assets): docs/assets를 docs/.assets로 옮김` |
| Full SHA | `e2737151a8eb056ce416995abfc2e2e550242387` |
| Short SHA | `e273715` |
| Branch | `feature/docs-assets-rename` |
| Parent | `e58d327` |
| Date | 2026-11-06 15:22:45 +0900 |

## 주 내용

- `docs/assets/`를 `docs/.assets/`로 옮겼다
- README·문서·그림 만들기 스크립트의 경로를 새 폴더로 바꿨다

## 상세

**배경**
사용자가 assets 폴더는 문서와 따로 취급하니 `.assets`로 이름을 바꾸라고 했다(2026-11-06).

**변경 범위**
`docs/.assets/readme/*`(그림·영상 30개, 내용 그대로), `README.md`, `docs/README.md`, `THIRD_PARTY_NOTICES.md`, `docs/trainings/image-pipeline.md`, `.agents/skills/codicomperchat/SKILL.md`, `scripts/readme-media/README.md`, `scripts/readme-media/env.mjs`(출력 폴더).

**기술 포인트**
`git mv`로 옮겨 기록이 이어진다. 바뀐 경로의 그림 링크가 모두 실제 파일을 가리키는지 스크립트로 확인했다.

**안 한 것**
지난 커밋 기록(`docs/branchs/commits/`)의 옛 경로는 그때의 사실이라 고치지 않았다.

## 결과

**동작 확인**
README·docs/README·image-pipeline의 그림 링크 확인, 빠진 파일 0.

**리스크**
GitHub가 점으로 시작하는 폴더의 그림을 README에서 보여 주는지는 원격에서 확인하지 못했다(일반적으로 보여 준다).

**후속**
새 그림과 `docs/.assets/README.md`.

**관련 문서**
[docs/README.md](../../README.md)
