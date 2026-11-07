# 안내의 테이블 수를 37개로 맞추다

| 항목 | 내용 |
|------|------|
| Subject | `docs(db): 안내의 테이블 수를 37개로 맞추다` |
| Full SHA | `d3e2ff4521b463e964e8b0587fa4281efc0e7dd4` |
| Short SHA | `d3e2ff4` |
| Branch | `feature/docs-live-status` |
| Parent | `1bc39fb` |
| Date | 2026-11-07 23:11:50 +0900 |

## 주 내용

- API 안내의 테이블 수를 37개로 고치고, 28개는 월드 표 이전 수라고 적었다
- DB 문서에 37개와 월드 표가 2026-11-06에 반영됐다는 문장을 덧붙였다

## 상세

**배경**
스키마 정본은 37개인데 API 안내는 28개로 남아 있었다.

**변경 범위**
apps/api/README.md, docs/plan/DATABASE.md

**기술 포인트**
본문을 다시 쓰지 않았다. 개수와 반영 시점만 고쳤다.

**안 한 것**
schema.prisma. 기획 원본.

## 결과

**동작 확인**
문서 수정만

**리스크**
없음

**후속**
develop 병합과 푸시

**관련 문서**
[docs/plan/DATABASE.md](../plan/DATABASE.md)
[docs/STATUS.md](../STATUS.md)
