# 문서 곳곳에 구조 그림 넣기

| 항목 | 내용 |
|------|------|
| Subject | `docs: 문서 곳곳에 구조 그림 넣기` |
| Full SHA | `0cd812002cbecb10d93bb00bdf71fc4ad439f32e` |
| Short SHA | `0cd8120` |
| Branch | `feature/docs-diagrams` |
| Parent | `a022daf` |
| Date | 2026-11-06 15:59:45 +0900 |

## 주 내용

- 문서 21곳에 구조 그림을 넣었다. `docs/README.md`에 "구조 그림 한눈에" 표(그림 11장과 자세한 문서)를 더했다
- 루트 README 구조 절에 계층·배포·데이터·화면 그림 4장을 더했다

## 상세

**배경**
사용자 요청(2026-11-06): 문서에 아키텍처 그림표를 넣어 직관적으로, 전체적으로 한 번 업데이트.

**변경 범위**
`README.md`, `docs/README.md`, `WORKFLOW.md`, `DEPLOYMENT.md`, `AGENT_HANDOVER.md`, `Architecture/`(overview·layers·docker-topology·apps·data-flow), `plan/`(DATABASE·TESTING·NAVIGATION_IA·PROJECT_STRUCTURE·CURRENT_STACK·AI_MODEL_STRATEGY), `guidance/getting-started.md`, `web_management/`(docker-deploy·ports-inventory), `docs/.assets/README.md`, `scripts/readme-media/README.md`.

**기술 포인트**
문서마다 그 문서가 설명하는 그림만 넣었다(배포 문서에 배포 그림, DB 문서에 데이터 지도 등). 상대 경로는 문서 위치마다 다르게 썼다.

**안 한 것**
글 내용은 바꾸지 않았다(앞 커밋에서 이미 갱신).

## 결과

**동작 확인**
링크 검사 1004개(그림 68곳) 깨짐 0.

**리스크**
없음.

**후속**
없음.

**관련 문서**
[docs/README.md](../../README.md)
