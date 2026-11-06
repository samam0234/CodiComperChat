# Oracle 배포 명령에 core.eol=lf 추가

| 항목 | 내용 |
|------|------|
| Subject | `docs(deploy): Oracle 배포 명령에 core.eol=lf 추가` |
| Full SHA | `b8c2a1ea83e606a93fe35c4635e5d516ee81e3cf` |
| Short SHA | `b8c2a1e` |
| Branch | `feature/oracle-backend-deploy` |
| Parent | `a6cafd9` |
| Date | 2026-11-07 01:18:03 +0900 |

## 주 내용

- 배포 명령에 `-c core.eol=lf`를 더했다

## 상세

**배경**
`core.autocrlf=false`만 주면 `text`로 정한 파일이 Windows 기본 `core.eol`(CRLF)로 나갔다.

**변경 범위**
`docs/web_management/oracle-backend.md`.

**기술 포인트**
실측: `.env.example`의 CR이 autocrlf=false만으로는 21개, `core.eol=lf`를 더하면 0개.

**안 한 것**
없음.

## 결과

**동작 확인**
`git archive ... | tar -xO | tr -cd '\r' | wc -c`가 0.

**리스크**
없음.

**후속**
없음.
