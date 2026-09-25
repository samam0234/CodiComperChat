# services/ai용 VSCode Python 인터프리터 경로 고정

| 항목 | 내용 |
|------|------|
| Subject | `chore(infra): services/ai용 VSCode Python 인터프리터 경로 고정` |
| Full SHA | `28768a2a5b42bcf7da039de7fd3641a9cb433b7e` |
| Short SHA | `28768a2` |
| Branch | `feature/vscode-python-interpreter` |
| Parent | `e473130` (develop) |
| Date | 2026-09-25T20:17:42+09:00 |

## 주 내용

- 루트에 `.vscode/settings.json` 신규 생성
- `python.defaultInterpreterPath`를 `services/ai/.venv/Scripts/python.exe`로 고정
- `python.analysis.extraPaths`에 `services/ai`를 추가해 `app` 패키지 임포트 정적 분석 지원

## 상세

**배경**
사용자가 `services/ai` venv를 activate해서 `pip install -r requirements.txt`까지 했는데도 VSCode 에디터에서 `from fastapi import FastAPI`에 "가져오기 fastapi을(를) 확인할 수 없습니다" 경고가 뜬다고 보고. 확인해 보니 `.venv`에는 fastapi 0.141.1이 정상 설치돼 있었고, 문제는 저장소 어디에도 `.vscode/settings.json`이 없어 Pylance가 어떤 인터프리터를 분석 대상으로 쓸지 지정된 바가 없었던 것.

**변경 범위**
저장소 루트 (`.vscode/`), 코드 변경 없음

**기술 포인트**
- `${workspaceFolder}` 상대 경로를 사용해 다른 머신에서도 그대로 동작하도록 함
- `python.analysis.extraPaths`를 함께 지정한 이유: `services/ai/app/main.py`가 `from app.routes import ...`처럼 `services/ai`를 루트로 가정하는 절대 import를 쓰기 때문에, 인터프리터만 지정해서는 그 부분까지 정적 분석이 못 따라감

**안 한 것**
- `apps/web`, `apps/api`용 인터프리터/SDK 경로 설정은 손대지 않음 (TypeScript 프로젝트라 해당 없음)

## 결과

**동작 확인**
- `services/ai/.venv/Scripts/python.exe -c "import fastapi"` 로컬 실행 성공 확인 (설치 자체는 문제없었음을 재확인)
- VSCode 쪽은 사용자에게 `Python: Select Interpreter` 후 재확인을 안내함 (에디터 재시작이 필요할 수 있어 이 세션에서 직접 검증은 못 함)

**리스크**
- 사용자가 인터프리터를 수동으로 재선택하지 않으면 캐시된 이전 선택이 남아있을 수 있음

**후속**
- 없음

**관련 문서**
- [services/ai/README.md](../../../services/ai/README.md)
