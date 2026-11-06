# feature/docs-mermaid into develop

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/docs-mermaid into develop` |
| Full SHA | `d7fc37358eca64cd6d81b6a917a55422b2e04675` |
| Short SHA | `d7fc373` |
| Branch | `develop` |
| Parent | `3bced11, 21c96ab` |
| Date | 2026-11-06 16:27:53 +0900 |

## 주 내용

- `feature/docs-mermaid`를 `develop`에 `--no-ff`로 병합했다

## 상세

**배경**
사용자가 mermaid 그림을 넣고 커밋한 뒤 main까지 병합하라고 했다(2026-11-06).

**변경 범위**
md 108개의 mermaid 그림(161개 블록)과 `scripts/check-mermaid.mjs`.

**기술 포인트**
병합 커밋을 먼저 만들고 기록을 따로 남겼다.

**안 한 것**
코드 변경 없음(새 스크립트 하나). 푸시는 하지 않았다.

## 결과

**동작 확인**
mermaid 161개 파싱 실패 0, 문서 링크 깨짐 0, 기록 작성기·어댑터 시험 36개 통과. 앱 코드는 바뀌지 않아 직전 전체 검증 결과가 그대로다.

**리스크**
없음.

**후속**
main 병합.

**관련 문서**
[docs/README.md](../../README.md)
