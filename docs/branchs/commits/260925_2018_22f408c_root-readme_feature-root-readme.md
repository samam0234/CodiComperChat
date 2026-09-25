# 루트 README 추가

| 항목 | 내용 |
|------|------|
| Subject | `docs(docs): 루트 README 추가` |
| Full SHA | `22f408cba6bf7431bbd8ee4b5bdba80f1914654a` |
| Short SHA | `22f408c` |
| Branch | `feature/root-readme` |
| Parent | `fde07ba` (develop) |
| Date | 2026-09-25T20:18:21+09:00 |

## 주 내용

- 루트 `README.md` 신규 생성
- 폴더 구조 트리와 호출 방향(web → api → ai, ai는 Nest만 내부망 호출) 도식
- `apps/web` `apps/api` `services/ai` `docs` `.agents` 각 파트 소개 + 기존 README 링크
- 빠른 시작 명령(`docker compose up -d`, `npm run dev:api`, `npm run dev:web`, FastAPI venv 기동)
- 작업 규칙 요약(커밋 형식, 커밋 기록, 브랜치·병합, v1 범위)

## 상세

**배경**
저장소에 `apps/web/README.md`, `apps/api/README.md`, `services/ai/README.md`, `docs/README.md`, `.agents/README.md`는 있었지만 루트 README가 없어서, 처음 저장소를 여는 사람이 전체 구조를 파악할 진입점이 없었음. 사용자가 "gitignore된 부분을 제외하고 각 파트 소개하는 readme"를 요청.

**변경 범위**
저장소 루트 (`README.md` 신규), 코드 변경 없음

**기술 포인트**
- 내용을 새로 지어내지 않고 기존 앱별 README·`docs/plan/CURRENT_STACK.md`·`docs/README.md`·`AGENTS.md`에서 이미 정리된 사실만 요약·링크
- 각 파트 섹션은 해당 앱의 실제 README로 링크해 정본이 두 곳에서 어긋나지 않게 함

**안 한 것**
- `apps/api/src`, `apps/web/app` 등 개별 하위 폴더 README는 만들지 않음 (요청 범위가 "루트 README"였고, 하위 폴더별 README는 별도 논의 필요)
- 기획 원본(`CodiComperChat_project_plan.md`)은 건드리지 않음

## 결과

**동작 확인**
README 내 상대링크 대상 파일(`docs/guidance/getting-started.md` 등) 전부 존재 확인함

**리스크**
없음 — 문서 전용 변경

**후속**
필요 시 하위 폴더별 README 추가 여부는 사용자 확인 후 진행

**관련 문서**
[docs/README.md](../../README.md), [docs/plan/CURRENT_STACK.md](../../plan/CURRENT_STACK.md)
