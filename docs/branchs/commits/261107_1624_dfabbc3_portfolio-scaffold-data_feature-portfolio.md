# 포트폴리오 폴더와 콘텐츠 정본·데이터 생성기를 만든다

| 항목 | 내용 |
|------|------|
| Subject | `feat(portfolio): 포트폴리오 폴더와 콘텐츠 정본·데이터 생성기를 만든다` |
| Full SHA | `dfabbc3858be724082a85cf4eed80e6717b01b86` |
| Short SHA | `dfabbc3` |
| Branch | `feature/portfolio` |
| Parent | `fd71be2` |
| Date | 2026-11-07 16:24:21 +0900 |

## 주 내용

- 루트에 `PortFolio/`(frontend · PortFile · server/backend · server/ai_services · shared · scripts)를 만들었다
- 루트에 있던 기획 스프레드시트를 `PortFolio/PortFile/`로 옮겼다(이전에는 커밋되지 않은 파일이었다)
- 콘텐츠 정본 `shared/content/portfolio.json`: 사이트 소개, 목차 8개, 프론트엔드·어드민 콘솔·백엔드·AI·미래 지향 페이지를 사용자가 준 양식(개요·엔진·기능·API·내부 페이지·디자인·문제점·고급 기술·추가 서버·미래)대로 썼다
- `scripts/build_data.py`: 스프레드시트 9개 시트 → `sheets.json`, ERD mermaid(ERD 브랜치) → `erd.json`(테이블 37·관계 40), 저장소 문서 22개 + 콘텐츠 + 시트 → 챗봇 RAG 자료 24개

## 상세

**배경**
사용자가 포트폴리오 전용 폴더(Astro · Rails · Flask)와 문서 파일, 스프레드시트·ERD 페이지, RAG 챗봇을 요청했다(2026-11-07).

**변경 범위**
`PortFolio/` 아래 새 파일만.

**기술 포인트**
머리글 없는 3칸 표(총기획)와 날짜 칸이 색으로 칠해진 간트 시트를 따로 판별한다. ERD는 아직 병합되지 않은 `origin/claude/project-thread-gkkp1j`에서 `git show`로 읽고, 병합 뒤에는 로컬 `docs/.assets/erd`를 먼저 쓴다. 각 서비스가 따로 배포되도록 JSON을 frontend·backend 폴더에 복사한다.

**안 한 것**
화면·서버는 다음 커밋들에서.

## 결과

**동작 확인**
`python PortFolio/scripts/build_data.py` → 시트 9 · ERD 테이블 37 · 관계 40 · 지식 문서 24.

**리스크**
없음.

**후속**
Flask AI, Rails, Astro, 문서 파일.
