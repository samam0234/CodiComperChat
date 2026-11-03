# develop into main (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: develop into main (no-ff)` |
| Full SHA | `de6b74c54698a4f28ef8fc4d2e76c64cdfcf9639` |
| Short SHA | `de6b74c` |
| Branch | `main` |
| Parent | `3900baa, b5691e5` |
| Date | 2026-11-04 06:23:55 +0900 |

## 주 내용

- `develop`을 `main`에 `--no-ff`로 병합했다

## 상세

**배경**
사용자가 코드 작업이 끝나면 `main`까지 병합하라고 지시했다(2026-11-04).

**변경 범위**
2026-10-25 이후 `develop`의 모든 작업.

**기술 포인트**
`release/*` 없이 직접 병합했다. 지금까지의 방식과 같다.

**안 한 것**
푸시. 스트리밍과 퀘스트 여러 개는 방향을 정하지 않아 만들지 않았다.

## 결과

**동작 확인**
병합 전 `develop`에서 타입 검사, API 210개, e2e 117개, 성인 끔 e2e 1개 통과. 깨끗한 클론 CI 재현 12/12 통과. `main`과 `develop`의 코드는 같다.

**리스크**
실제 모델 평가에 기준 미달 항목이 남아 있다. 실서버에서는 아직 돌리지 않았다.

**후속**
`docs/TASKS.md`, `docs/guidance/owner-checklist.md`.

**관련 문서**
[AGENT_HANDOVER.md](../../AGENT_HANDOVER.md)
