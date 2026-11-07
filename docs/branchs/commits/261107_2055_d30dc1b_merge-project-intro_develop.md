# feature/project-intro into develop

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/project-intro into develop` |
| Full SHA | `d30dc1be834c7ee8c9c33add0ba4f04e0910d91d` |
| Short SHA | `d30dc1b` |
| Branch | `develop` |
| Parent | `5339cf0, c595407` |
| Date | 2026-11-07 20:55:45 +0900 |

## 주 내용

- `feature/project-intro`를 병합했다: 이용자 웹 푸터 '프로젝트 소개' 링크와 `/project` 페이지

## 상세

**배경**
사용자 요청(2026-11-07).

**변경 범위**
`apps/web/components/site-footer.tsx`, `apps/web/app/project/`.

**안 한 것**
e2e 시험 추가.

## 결과

**동작 확인**
병합 뒤 웹 `tsc --noEmit` 통과.

**리스크**
없음.

**후속**
없음.
