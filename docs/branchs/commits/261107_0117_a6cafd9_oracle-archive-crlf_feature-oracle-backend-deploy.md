# Oracle 배포 문서에 줄바꿈 함정 추가

| 항목 | 내용 |
|------|------|
| Subject | `docs(deploy): Oracle 배포 문서에 줄바꿈 함정 추가` |
| Full SHA | `a6cafd9ca232c3a301a9ddc74a353d482b53aa6f` |
| Short SHA | `a6cafd9` |
| Branch | `feature/oracle-backend-deploy` |
| Parent | `e945987` |
| Date | 2026-11-07 01:17:40 +0900 |

## 주 내용

- 배포 문서의 `git archive` 명령에 줄바꿈 함정을 적었다

## 상세

**배경**
Windows(`core.autocrlf=true`)에서 `git archive`가 파일을 CRLF로 내보내 서버의 `.env` 값 끝에 `\r`이 붙을 수 있다.

**변경 범위**
`docs/web_management/oracle-backend.md`.

**기술 포인트**
`-c core.autocrlf=false`를 붙였다(다음 커밋에서 부족함을 확인).

**안 한 것**
없음.

## 결과

**동작 확인**
다음 커밋에서 실측.

**리스크**
이 명령만으로는 CRLF가 남는다(다음 커밋에서 고침).

**후속**
core.eol=lf 추가.
