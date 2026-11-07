# 웹·포트폴리오 사이트·공식 세계관의 실제 배포 상태를 적는다

| 항목 | 내용 |
|------|------|
| Subject | `docs(deploy): 웹·포트폴리오 사이트·공식 세계관의 실제 배포 상태를 적는다` |
| Full SHA | `8c654d8bc951650eac0cf97b897357aeb05c8d04` |
| Short SHA | `8c654d8` |
| Branch | `feature/deploy-status-1107b` |
| Parent | `7e04d69` |
| Date | 2026-11-07 22:12:52 +0900 |

## 주 내용

- `docs/web_management/oracle-backend.md`에 웹 `/project`·`PORTFOLIO_URL`, 포트폴리오 사이트 주소, 공식 세계관 시드 결과를 더했다
- `PortFolio/README.md`의 "배포하지 않았다"를 2026-11-07 실제 배포 상태로 고쳤다

## 상세

**배경**
사용자가 마무리로 배포해서 업데이트하라고 했다(2026-11-07). 배포한 사실과 못 한 것을 문서에 남긴다.

**변경 범위**
문서 2개.

**기술 포인트**
Vercel GitHub 앱이 연결돼 있지 않아 포트폴리오 프로젝트를 저장소에 연결하지 못했고(400), 프로젝트만 만든 뒤 GitHub 소스 배포로 올렸다. 그래서 푸시해도 자동 배포되지 않는다. 웹(`codicomperchat-web`)도 푸시로는 배포되지 않아 `create_deployment`로 직접 배포했다.

**안 한 것**
Rails·Flask 서버 배포. 기존 Oracle 서버는 2 OCPU·12GB에 api·ai·ollama가 이미 돌아 gemma4:12b(약 8GB)를 더 올릴 수 없다.

## 결과

**동작 확인**
웹 `/project`·`/worlds`·`/` 200, 월드 목록에 코퍼 시티, 지도 200(170,802B). 서버 DB에 세계관 1개(공개·발행, 장소 10·그림 4). 포트폴리오 사이트 `/`·`/backend`·`/erd`·`/data`·`/chat`·PDF·이미지 200.

**리스크**
포트폴리오 사이트의 챗봇·빠른 찾기는 서버 꺼짐(데모 모드)로 보인다.

**후속**
챗봇용 서버를 어디에 올릴지 결정.
