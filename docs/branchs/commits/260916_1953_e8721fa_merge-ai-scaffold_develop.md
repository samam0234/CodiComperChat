# feature/ai-scaffold → develop 병합 (--no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/ai-scaffold into develop (no-ff)` |
| Full SHA | `e8721fa8410656e4ac28f1d90c95ee84e321e8c6` |
| Short SHA | `e8721fa` |
| Branch | `develop` |
| Parent | `6777339` `9a95959` |
| Date | 2026-09-16 19:53:57 +0900 |

## 주 내용

- `feature/ai-scaffold`를 develop에 `--no-ff`로 병합
- 포함 커밋: `448b009`(FastAPI 라우트 뼈대), `8a17251`(요청·응답 스키마 계층), 각각의 커밋 기록·병합 기록
- 충돌 2건 수동 해결: `docs/branchs/README.md`, `docs/plan/CURRENT_STACK.md`
- develop에 `services/ai/app/` 소스가 처음으로 들어옴

## 상세

**배경**
사용자가 FastAPI dev 서버를 켰다가 `ERROR: Error loading ASGI app. Could not import module "app.main"`를 만났다. 원인 확인 결과, `services/ai/app/`(main.py, routes/, schemas/, services/)는 `feature/ai-scaffold`에만 있고 develop에는 한 번도 병합된 적이 없었다. 직전에 캐릭터 업로드 작업(character-card / prisma-schema / character-seed 3브랜치)을 하면서 `git checkout develop`을 반복했는데, 그때마다 워킹트리가 develop 상태로 되돌아가며 ai-scaffold 전용 파일이 디스크에서 사라졌다 — `__pycache__`의 stale `.pyc`만 남고 `.py` 원본이 없어진 것으로 확인했다.

두 가지 해결책(① ai-scaffold를 develop에 병합해 근본 해결, ② 지금은 브랜치만 전환해 임시 회피)을 사용자에게 물었고 **①**을 선택받았다.

**변경 범위**
- `services/ai/app/` 전체(신규): `main.py`, `routes/*.py` 5개, `schemas/*.py` 6개, `services/*.py` 3개
- `services/ai/README.md`, `services/ai/requirements.txt`
- 문서(충돌 해결): `docs/branchs/README.md`, `docs/plan/CURRENT_STACK.md`
- 문서(충돌 없이 자동 병합): `docs/API_DOCUMENTATION.md`, `docs/Architecture/{apps,layers}.md`, `docs/README.md`, `docs/guidance/getting-started.md`, `docs/plan/{AI_MODEL_STRATEGY,PROJECT_STRUCTURE,TESTING}.md`, `docs/web_management/ports-inventory.md`

**기술 포인트**
- 충돌은 정확히 예상한 두 파일뿐이었다 — 둘 다 "표에 새 행을 추가"하는 순수 추가형 변경이라 병합이 단순했다. `README.md`는 날짜 순으로 ai-scaffold 커밋(09-15)을 character 커밋(09-16)보다 앞에 배치했다. `CURRENT_STACK.md`는 포트 표 3줄이 갈렸는데, FastAPI 8000은 ai-scaffold 쪽 "확정"을, PostgreSQL 5432·Redis 6379는 내 쪽 값을 그대로 살려 합쳤다 — 서로 다른 포트라 겹치는 정보가 없었다.
- 코드 충돌은 0건이었다. ai-scaffold가 `services/ai/`만, 내 작업이 `apps/api/`+`docs/plan/CHARACTERS.md`만 건드려 겹치는 코드 파일이 없었다.
- 병합 직후 `git commit --no-edit`로 만든 첫 커밋 메시지에 Co-Authored-By 푸터가 빠진 것을 바로 알아채고, 푸시 전이라 `--amend`로 고쳤다. `develop`이지만 원격에 없는 로컬 전용 커밋이라 이력 훼손 위험이 없었다.

**안 한 것**
- 원격 푸시 — 하지 않았다.
- ai-scaffold의 세부 구현 검증(스키마 필드명이 Nest DTO와 맞는지 등) — 이번엔 병합만.

## 결과

**동작 확인**
- 충돌 마커(`<<<<<<<`) 잔존 여부 grep → 없음
- `services/ai/app/main.py` 등 실제 파일 존재 확인
- 병합 후 `uvicorn app.main:app`로 FastAPI 기동 확인 예정 (다음 단계)

**리스크**
- 브랜치 전환이 작업트리에서 "안 보이는" 파일 삭제로 나타난다는 걸 이번에 체감했다. 앞으로 여러 feature를 오갈 때는 `git status`로 사라진 파일이 있는지 먼저 확인해야 한다.

**후속**
- FastAPI 서버 기동 확인 (`services/ai`)
- Nest DTO ↔ FastAPI 스키마 필드명 정합성 확인 (`8a17251` 기록의 "후속" 항목)

**관련 문서**
`docs/guidance/branch-merge.md`, `docs/plan/CURRENT_STACK.md`, `docs/Architecture/layers.md`
