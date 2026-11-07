# Oracle 서버 배포 상태를 문서에 반영

| 항목 | 내용 |
|------|------|
| Subject | `docs(deploy): Oracle 서버 배포 상태를 문서에 반영` |
| Full SHA | `b85ac64b63bbcc583bbfbadeb775b2695f5196b6` |
| Short SHA | `b85ac64` |
| Branch | `claude/project-thread-pz0x5f` |
| Parent | `39e4566` |
| Date | 2026-11-07 09:02:33 +0900 |

## 주 내용

- `DEPLOYMENT.md`, `AGENT_HANDOVER.md`, `web_management/oracle-backend.md`의 배포 상태를 "안 함"에서 Oracle 배포 기준으로 고쳤다

## 상세

**배경**
사용자가 병합과 배포 상태 업데이트를 요청했다(2026-11-07). 같은 날 Oracle Cloud A1.Flex에 API·DB·AI(대화)를 올리고 확인했다.

**변경 범위**
문서 3개. `oracle-backend.md`에 "배포 상태" 표(컨테이너, 확인 결과, 비어 있는 값, 안 올린 것, 백업)를 더했다.

**기술 포인트**
접속 키·비밀값은 문서에 적지 않았다. 비어 있는 값은 이름만 적었다.

**안 한 것**
TASKS.md의 할 일 번호는 바꾸지 않았다.

## 결과

**동작 확인**
`node scripts/check-mermaid.mjs` 실패 0. 서버 `/health` HTTPS 200은 배포 때 확인.

**리스크**
없음.

**후속**
웹·콘솔 배포, SMTP, 백업 cron, 페르소나 파일 옮기기.
