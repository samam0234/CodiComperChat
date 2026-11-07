# 허브가 기능과 현황을 나눠 가리키게 하다

| 항목 | 내용 |
|------|------|
| Subject | `docs(docs): 허브가 기능과 현황을 나눠 가리키게 하다` |
| Full SHA | `02c1450a8e8efaee9c30a682cb43afc1ba9afb78` |
| Short SHA | `02c1450` |
| Branch | `feature/docs-live-status` |
| Parent | `f2fede1` |
| Date | 2026-11-07 23:11:12 +0900 |

## 주 내용

- 문서 허브의 테이블 28개를 37개로 고치고 현황 문서를 가리키게 했다
- 인수인계의 시스템 그림은 로컬 모양이라고 밝히고, 배포 입구와 루트 안내에 현황 링크를 넣었다
- 포트폴리오 사이트의 챗봇 모델이 e4b 하나라는 한 줄을 운영 서버 문서에 더했다

## 상세

**배경**
허브 첫 문단이 월드 표 이전의 테이블 수를 지금 상태처럼 적고 있었다. 기능 목록과 운영 현황을 어디서 보는지가 허브에 없었다.

**변경 범위**
docs/README.md, docs/AGENT_HANDOVER.md, docs/DEPLOYMENT.md, README.md, docs/web_management/oracle-backend.md

**기술 포인트**
기존 기능 설명 문단은 지우지 않고 틀린 수와 빠진 링크만 고쳤다. 루트 "지금 되는 것" 표의 동작은 로컬 코드 기준이라고 한 문장을 덧붙였다.

**안 한 것**
기획 원본. 기능 표의 기존 줄. API README의 테이블 수는 다음 커밋.

## 결과

**동작 확인**
문서 수정만

**리스크**
없음

**후속**
API 안내와 DB 문서의 테이블 수 설명

**관련 문서**
[docs/STATUS.md](../STATUS.md)
[docs/plan/DATABASE.md](../plan/DATABASE.md)
