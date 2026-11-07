# develop into main (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: develop into main (no-ff)` |
| Full SHA | `192463447fc580f92e16fe80acb0885a5bc0819d` |
| Short SHA | `1924634` |
| Branch | `main` |
| Parent | `ee2a219, b94b1f2` |
| Date | 2026-11-08 00:50:36 +0900 |

## 주 내용

- `develop`을 `main`에 `--no-ff`로 병합했다.
- 대화 수정·기억·때와 곳·말풍선·조사가 main에 들어 있다.

## 상세

**배경**
웹 배포는 main을 본다. 사용자가 main까지 병합하고 푸시하라고 했다.

**변경 범위**
병합 커밋.

**기술 포인트**
`--no-ff`. force-push는 하지 않는다.

**안 한 것**
운영 VM을 이 자리에서 다시 띄우지 않는다. 그래서 API 마이그레이션은 푸시만으로 적용되지 않는다.

## 결과

**동작 확인**
병합 전 시험은 develop 병합 기록과 같다.

**리스크**
Vercel 웹이 main을 자동 배포하면 새 화면이 먼저 나가고, Oracle API가 옛 이미지면 새 경로는 404다.

**후속**
운영 API 이미지를 다시 올려 마이그레이션을 적용한다.

**관련 문서**
`docs/AGENT_HANDOVER.md`, `docs/STATUS.md`
