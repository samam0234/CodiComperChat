# 앱 안내가 기능과 현황을 나누게 하다

| 항목 | 내용 |
|------|------|
| Subject | `docs(readme): 앱 안내가 기능과 현황을 나누게 하다` |
| Full SHA | `a9c9e797d87021c8c986e6c7c29de06b2080590e` |
| Short SHA | `a9c9e79` |
| Branch | `feature/readme-status-sync` |
| Parent | `378704f` |
| Date | 2026-11-07 23:16:36 +0900 |

## 주 내용

- 루트 README에 프로젝트 소개·포트폴리오 사이트·현황 문서 링크를 넣었다
- 웹·API·콘솔·AI·e2e 안내가 코드에 있는 기능과 지금 열리는 범위를 나누게 했다

## 상세

**배경**
앱 README가 로컬에서 되는 화면만 적거나, 공개 주소의 현황을 기능 목록과 같은 말로 읽히게 했다.

**변경 범위**
README.md, apps/web/README.md, apps/api/README.md, console/README.md, services/ai/README.md, e2e/README.md

**기술 포인트**
기존 화면 목록은 2026-11-06 집계로 남기고, 월드와 /project는 그 뒤에 더해진 것으로 적었다. e2e는 공개 Vercel을 치지 않는다고 밝혔다.

**안 한 것**
기획 원본. 기능 표의 기존 줄. PortFolio/server/ai_services/knowledge 의 생성 복사본.

## 결과

**동작 확인**
문서 수정만

**리스크**
챗봇 RAG 자료의 README 복사본은 build_data.py를 다시 돌려야 루트 README와 같아진다. 이번엔 돌리지 않았다.

**후속**
보안 상태 문장과 에이전트 읽기 순서

**관련 문서**
[docs/STATUS.md](../STATUS.md)
