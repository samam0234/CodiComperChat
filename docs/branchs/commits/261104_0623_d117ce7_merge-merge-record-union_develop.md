# feature/merge-record-union into develop (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/merge-record-union into develop (no-ff)` |
| Full SHA | `d117ce7a143e994424533122b3e12d6961820bd2` |
| Short SHA | `d117ce7` |
| Branch | `develop` |
| Parent | `64467ff, a84bed8` |
| Date | 2026-11-04 06:23:54 +0900 |

## 주 내용

- 커밋 기록 목록의 병합 충돌을 `merge=union`으로 없앴다
- `set -e`에 기대지 말라고 인수인계를 고쳤다

## 상세

**배경**
`main` 병합이 기록 목록에서 충돌했는데, `set -e`가 멈추지 않아 충돌 표시가 남은 채 기록 커밋이 올라갔다. 푸시 전이라 로컬에서 그 커밋을 되돌리고 다시 병합했다.

**변경 범위**
`.gitattributes`, `docs/AGENT_HANDOVER.md`.

**기술 포인트**
목록은 줄만 쌓이므로 양쪽 줄을 모두 남겨도 된다.

**안 한 것**
코드 변경.

## 결과

**동작 확인**
이 커밋을 `develop`과 `main`에 병합할 때 충돌이 나는지로 확인한다.

**리스크**
목록 순서가 날짜순에서 조금 어긋날 수 있다.

**후속**
없음.

**관련 문서**
[AGENT_HANDOVER.md](../../AGENT_HANDOVER.md)
