# develop into main

| 항목 | 내용 |
|------|------|
| Subject | `merge: develop into main` |
| Full SHA | `1f7be8643d452fb896f09c6b02e6d4f7922b2bf1` |
| Short SHA | `1f7be86` |
| Branch | `main` |
| Parent | `a58c0e7, 96d01e6` |
| Date | 2026-11-07 02:13:34 +0900 |

## 주 내용

- Oracle Cloud ARM 서버에 백엔드만 올리는 배포 구성(`deploy/oracle/`)과 절차 문서를 병합했다

## 상세

**배경**
사용자가 "병합"이라고 말해 main에 병합했다(2026-11-07). 같은 구성으로 서버에 배포해 `/health` HTTPS 200을 확인했다.

**변경 범위**
`deploy/oracle/*`, `docs/web_management/oracle-backend.md`, 커밋 기록 3개.

**안 한 것**
푸시는 하지 않았다.

## 결과

**동작 확인**
서버에서 컨테이너 4개가 뜨고 마이그레이션·시드가 적용됐다. 병합 뒤 코드 시험은 돌리지 않았다(문서·배포 파일만 추가).

**리스크**
AI 서버·메일이 없는 구성이다.

**후속**
프론트 배포, 도메인, SMTP.
