# VS Code 터미널이 .env를 읽도록 설정

| 항목 | 내용 |
|------|------|
| Subject | `chore(infra): VS Code 터미널이 .env를 읽도록 설정` |
| Full SHA | `ab11016fdc4b84344406747f07a2aaa052f7e9a5` |
| Short SHA | `ab11016` |
| Branch | `feature/vscode-env-file` |
| Parent | `caedc53` (develop) |
| Date | 2026-10-17T00:08:45+09:00 |

## 주 내용

- .vscode/settings.json에 `python.terminal.useEnvFile: true` 추가

## 상세

**배경**
사용자가 로컬에서 바꾼 에디터 설정이 작업 트리에 남아 있어 함께 커밋한다("남은 변경 사항까지 커밋").

**변경 범위**
.vscode/settings.json

**기술 포인트**
- VS Code Python 확장이 통합 터미널을 열 때 작업 폴더의 .env를 환경변수로 읽게 한다. services/ai는 앱이 스스로 .env를 읽으므로 동작에는 영향이 없고, 터미널에서 직접 python을 실행할 때만 도움이 된다.

**안 한 것**
없음

## 결과

**동작 확인**
- JSON 형식 확인(diff 한 줄)

**리스크**
없음

**후속**
없음

**관련 문서**
없음
