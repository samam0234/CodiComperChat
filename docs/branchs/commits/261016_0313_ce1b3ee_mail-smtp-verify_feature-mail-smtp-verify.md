# 실제 SMTP 서버로 메일 발송을 확인하는 시험과 발송 확인 도구 추가

| 항목 | 내용 |
|------|------|
| Subject | `test(api): 실제 SMTP 서버로 메일 발송을 확인하는 시험과 발송 확인 도구 추가` |
| Full SHA | `ce1b3ee2e9b91c931ca9aa03e48619f487ea67c8` |
| Short SHA | `ce1b3ee` |
| Branch | `feature/mail-smtp-verify` |
| Parent | `861796e` (fix/flaky-rate-store-test) |
| Date | 2026-10-16T03:13:20+09:00 |

## 주 내용

- `src/mail/mail.service.spec.ts`: 시험 안에 실제 SMTP 서버를 띄우고 메일 모듈이 `MAIL_SMTP_URL`로 접속해 보낸 메일을 받아 읽음
- 확인: SMTP 인증(특수문자 비밀번호는 URL 인코딩), 한글 제목, 본문의 링크, 보낸 사람 이름·주소, 받는 사람 / 인증이 틀리면 실패 / 폴더 저장 / 운영에서 설정이 없으면 보내지 않되 실패하지 않음
- `npm run mail:check --workspace api -- 받을주소`: 설정한 SMTP로 시험 메일 한 통(연결 확인 `verify` 후 발송, 설정 값은 출력하지 않음)
- devDependencies: `smtp-server`, `mailparser`(시험용)

## 상세

**배경**
사용자 요청("확인하지 못했거나 할 수 없는 것을 배포 제외하고 진행"). 이메일 인증·비밀번호 찾기는 e2e에서 폴더 저장으로만 확인했고, 실제 SMTP로 보내는 경로는 한 번도 지나가 보지 않았다.

**변경 범위**
apps/api(mail 시험, scripts, package.json), .env.example, docs

**기술 포인트**
- 외부 메일 서비스 없이도 SMTP 경로를 끝까지 지나게, 시험 안에서 실제 SMTP 서버를 띄웠다(실제 메일 서비스처럼 인증 필수). 받은 원문을 메일 파서로 읽어 한글 제목 인코딩까지 확인한다.
- 확인 도구는 처음에 시험 SMTP 서버와 같은 프로세스에서 동기 실행해 "Greeting never received"로 실패했다 — 도구가 아니라 시험 방식(이벤트 루프를 막음)의 문제였고, 비동기로 돌리자 "250 OK"로 보냈다.

**안 한 것**
실제 메일 서비스(SES·SendGrid 등) 계정으로 보내기 — 계정이 있어야 한다. `mail:check`로 운영자가 확인한다

## 결과

**동작 확인**
- 메일 시험 4개 통과, API 전체 162개 통과
- `mail:check`를 로컬 시험 SMTP 서버로 실행해 발송 성공(250 OK)·서버 수신 확인

**리스크**
없음

**후속**
운영 메일 서비스 계정 연결 후 mail:check

**관련 문서**
[docs/API_DOCUMENTATION.md](../../API_DOCUMENTATION.md)
