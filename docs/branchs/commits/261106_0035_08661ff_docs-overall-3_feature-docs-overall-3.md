# 전체 문서를 이번 실측과 상태에 맞게 갱신

| 항목 | 내용 |
|------|------|
| Subject | `docs(docs): 전체 문서를 이번 실측과 상태에 맞게 갱신` |
| Full SHA | `08661ffc88f4d5f1e99d542f7ed713981d246b7e` |
| Short SHA | `08661ff` |
| Branch | `feature/docs-overall-3` |
| Parent | `368bf22` |
| Date | 2026-11-06 00:35:22 +0900 |

## 주 내용

- 시험·할 일·소유자 안내·구조 문서를 이번 결과에 맞게 고쳤다
- 표로 흩어진 실제 모델 결과를 `trainings`로 모았다

## 상세

**배경**
사용자가 전체 문서 업데이트를 요청했다(2026-11-06). 평가를 새로 돌려 보상 장면 수치 등이 바뀌었다.

**변경 범위**
`docs/README.md`, `docs/TASKS.md`, `docs/plan/`, `docs/guidance/owner-checklist.md`, `docs/Architecture/layers.md`, `docs/FEATURES.md`, `docs/DEPLOYMENT.md`, 페르소나 README.

**기술 포인트**
`TASKS.md`에 README를 찍다 발견한 화면 문제(Q07)를 넣었다. `docs/assets/readme/`를 폴더 지도에 넣었다.

**안 한 것**
Q01~Q07을 고치지 않았다.

## 결과

**동작 확인**
문서 안 상대 링크 434개 검사, 깨진 것 없음. README의 HTML 그림 경로도 확인했다.

**리스크**
인수인계의 병합·푸시 상태는 이번 병합을 전제로 적었다.

**후속**
에이전트 문서.

**관련 문서**
[TASKS.md](../../TASKS.md)
