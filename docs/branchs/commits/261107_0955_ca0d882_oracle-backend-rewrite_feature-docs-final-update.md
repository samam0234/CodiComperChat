# Oracle 운영 서버 문서를 지금 구성의 정본으로 다시 쓴다

| 항목 | 내용 |
|------|------|
| Subject | `docs(deploy): Oracle 운영 서버 문서를 지금 구성의 정본으로 다시 쓴다` |
| Full SHA | `ca0d8820d4593c23df42d316b739e82cd538f957` |
| Short SHA | `ca0d882` |
| Branch | `feature/docs-final-update` |
| Parent | `32e296c` |
| Date | 2026-11-07 09:55:23 +0900 |

## 주 내용

- `docs/web_management/oracle-backend.md`를 지금 운영 서버의 정본으로 다시 썼다
- 상태 표(연결 확인 포함), mermaid 로직 구조, 접속 키 사정, 올리기·다시 올리기, 점검 명령, 웹 연결(프록시 토큰·도메인 교체)

## 상세

**배경**
문서가 "백엔드만 올리기" 시점에 머물러 있었고, 명령이 지금은 없는 ssh 별칭과 compose 한 파일을 썼다.

**변경 범위**
문서 1개.

**기술 포인트**
compose 두 파일을 항상 함께 주는 변수 `C`를 쓴다. `bootstrap.sh`·`setup.sh`를 이 서버에서 돌리지 말라고 적었다. 개인키 경로·내용은 적지 않았다.

**안 한 것**
없음.

## 결과

**동작 확인**
`node scripts/check-mermaid.mjs` 실패 0. 명령은 2026-11-07에 실제로 쓴 것과 같다(별칭만 변수로 바꿈).

**리스크**
없음.

**후속**
없음.
