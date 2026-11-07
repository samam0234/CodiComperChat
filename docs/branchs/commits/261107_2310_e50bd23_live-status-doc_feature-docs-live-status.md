# 기능과 운영 현황을 나누는 문서를 추가

| 항목 | 내용 |
|------|------|
| Subject | `docs(status): 기능과 운영 현황을 나누는 문서를 추가` |
| Full SHA | `e50bd235b38e81f0be1d1fa3e19f4e7e79207ae5` |
| Short SHA | `e50bd23` |
| Branch | `feature/docs-live-status` |
| Parent | `3da3d84` |
| Date | 2026-11-07 23:10:29 +0900 |

## 주 내용

- 구현된 기능과 지금 공개 주소의 현황을 나누는 docs/STATUS.md를 추가했다
- 기획 원본과 FEATURES의 기존 줄은 이 현황으로 덮지 않는다고 적었다

## 상세

**배경**
기능 목록의 "구현"과 운영 서버에서 실제로 열리는 범위가 한 문장에 섞여, 그림·메일·콘솔·12b가 지금 웹에서 되는 것처럼 읽혔다.

**변경 범위**
docs/STATUS.md

**기술 포인트**
추가 문서다. 숫자는 스택·DB·시험 정본에 두고 여기에는 복제하지 않았다. 포트폴리오 사이트는 제품 웹과 따로 두었고, 챗봇 모델은 gemma4:e4b 하나라고 적었다.

**안 한 것**
기존 기능 표 수정. 기획 원본. 병합과 푸시.

## 결과

**동작 확인**
문서 추가만. mermaid 1블록

**리스크**
배포가 바뀌면 이 문서와 oracle-backend를 같이 고쳐야 한다.

**후속**
허브와 기능 목록이 이 문서를 가리키게 한다

**관련 문서**
[docs/FEATURES.md](../FEATURES.md)
[docs/web_management/oracle-backend.md](../web_management/oracle-backend.md)
