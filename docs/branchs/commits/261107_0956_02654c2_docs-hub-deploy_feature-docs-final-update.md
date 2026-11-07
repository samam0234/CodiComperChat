# 문서 허브와 운영 문서 목록을 실제 배포 기준으로 고친다

| 항목 | 내용 |
|------|------|
| Subject | `docs(docs): 문서 허브와 운영 문서 목록을 실제 배포 기준으로 고친다` |
| Full SHA | `02654c23168c2e0ad66927d8b34763755a624618` |
| Short SHA | `02654c2` |
| Branch | `feature/docs-final-update` |
| Parent | `8510665` |
| Date | 2026-11-07 09:56:31 +0900 |

## 주 내용

- `docs/README.md` 현재 상태를 2026-11-07 실제 배포로 고치고 배포 행에 지금 서버·기록 링크를 더했다
- `docs/web_management/README.md` 목록에 oracle-backend·deploy-log·AI 스크립트·대안 안내를 더하고 로직 구조를 mermaid로 바꿨다

## 상세

**배경**
문서 허브가 "배포는 아직"으로 남아 있었다.

**변경 범위**
문서 2개.

**기술 포인트**
po3i10에서 들어온 안내 HTML은 지금 서버와 맞지 않는다고 목록에 표시했다.

**안 한 것**
그림(PNG) 표는 그대로.

## 결과

**동작 확인**
`node scripts/check-mermaid.mjs` 실패 0.

**리스크**
없음.

**후속**
없음.
