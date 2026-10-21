# 운영 콘솔 분리를 문서에 반영

| 항목 | 내용 |
|------|------|
| Subject | `docs(console): 운영 콘솔 분리를 문서에 반영` |
| Full SHA | `4f3dccec33bcdd6e74403fa6017b9e0c02c78f46` |
| Short SHA | `4f3dcce` |
| Branch | `feature/admin-console` |
| Parent | `a9425b3` (feature/admin-console) |
| Date | 2026-10-21T19:27:30+09:00 |

## 주 내용

- 운영 화면 주소를 콘솔(`/reports`·`/portraits`·`/characters`·`/users`, 대시보드 `/`)로 바꿈 (NAVIGATION_IA, operations, data-flow)
- 콘솔 앱을 구조·스택·포트 문서에 추가 (apps, overview, PROJECT_STRUCTURE, CURRENT_STACK, ports-inventory, docs/README)
- API 문서에 `/admin/stats`·`/admin/characters`·`/admin/characters/:id/portrait`
- 환경변수(콘솔 `API_BASE_URL`·`WEB_BASE_URL`, 웹 `CONSOLE_BASE_URL`), 시작 안내 `npm run dev:console`, 배포 시 콘솔을 바깥에 열지 않기
- 결제는 보류로 표시

## 상세

**배경**
운영 콘솔을 따로 띄우게 되어, 운영 화면이 이용자 사이트 안에 있다고 적힌 문서를 고쳤다. 결제는 사용자 결정("결제 기능은 보류")을 반영했다.

**변경 범위**
docs/

**기술 포인트**
- 원본 기획서(CodiComperChat_project_plan.md)는 건드리지 않음

**안 한 것**
없음

## 결과

**동작 확인**
- 예전 `/admin/reports|portraits|users` 화면 주소가 문서에 남지 않았는지 grep으로 확인

**리스크**
없음

**후속**
develop 병합

**관련 문서**
이 커밋
