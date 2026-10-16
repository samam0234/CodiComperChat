# 문서 허브·API 머리말·포트·배포 준비·디버그 일지를 지금 상태로

| 항목 | 내용 |
|------|------|
| Subject | `docs(docs): 문서 허브·API 머리말·포트·배포 준비·디버그 일지를 지금 상태로` |
| Full SHA | `a869cc9d67adf6ceb51a142ebd93a4849218624e` |
| Short SHA | `a869cc9` |
| Branch | `feature/docs-refresh` |
| Parent | `2183aa8` (feature/docs-refresh) |
| Date | 2026-10-17T00:05:16+09:00 |

## 주 내용

- `docs/README.md`(허브): 지금 동작 범위, 앱·포트(개발/e2e) 표, 빠른 링크, 코드 옆 README 목록
- `API_DOCUMENTATION.md` 머리말: "health 외 모두 501" → 실제 동작, 예외만
- `web_management/ports-inventory.md`: e2e 포트·Ollama·PostgreSQL
- `DEPLOYMENT.md`·`web_management/pre-deploy.md`·`plan/DEVELOPMENT_AND_DEPLOYMENT_GUIDE.md`·`Architecture/docker-topology.md`: 배포 전이라는 상태와 "배포 때 꼭 할 것" 표
- `plan/HARDCODING_ZONES.md`: 지금 고정해 둔 값 13개와 위치·바꿀 때
- `find_debug/2026-10-16.md`(신규), `repeater/test-flaky-under-load.md`·`repeater/empty-env-var.md`(신규), 각 README 목록
- `branchs/BRANCH_MAP.md` 현재 상태, `vaildates/mvp-checklist.md` 기술 점검과 8번(메시지 보존) 설계 차이, `trainings/README.md`

## 상세

**배경**
사용자 요청(문서 업데이트)의 마지막 묶음. 허브와 API 문서 머리말이 "뼈대만·501"이라 처음 보는 사람이 문서 전체를 잘못 읽게 됐다. SKILL.md §7의 폴더 규칙대로, 이번 주 장애는 find_debug(일지)에 남기고 다시 터질 수 있는 것은 repeater로 정리했다.

**변경 범위**
docs/(README, API_DOCUMENTATION, DEPLOYMENT, plan, Architecture, web_management, find_debug, repeater, branchs/BRANCH_MAP, vaildates, trainings)

**기술 포인트**
- 배포는 사용자 지시로 하지 않았지만, 구현하며 "배포 때 해야 한다"고 남긴 메모(프록시의 X-Forwarded-For 덮어쓰기, 서버 여러 대일 때 한도 저장소·대기열, NODE_ENV, 메일·토스, FastAPI 토큰, 지식 파일 옮기기, https)를 DEPLOYMENT.md 한곳에 모았다.
- 검증 체크리스트 8번(FastAPI가 죽어도 유저 메시지를 잃지 않는가)은 지금 설계(답을 받은 뒤에만 저장, 실패 턴은 다시 보냄)가 계획서의 "적어도 저장"과 다르다는 점을 숨기지 않고 적었다.
- docs/ 전체의 상대 링크 302개를 검사해 깨진 링크 0개를 확인했고, API 문서가 컨트롤러의 실제 경로를 모두 싣고 있는지 대조했다.

**안 한 것**
배포 문서의 실제 절차(배포 대상이 정해지면)

## 결과

**동작 확인**
- docs/ 상대 링크 302개 중 깨진 것 0
- API 문서 ↔ 컨트롤러 경로 대조(빠진 경로 없음)

**리스크**
없음

**후속**
배포 대상이 정해지면 web_management 절차 작성

**관련 문서**
[docs/README.md](../../README.md), [docs/DEPLOYMENT.md](../../DEPLOYMENT.md)
