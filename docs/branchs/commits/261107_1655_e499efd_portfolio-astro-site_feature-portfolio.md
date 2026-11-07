# Astro 포트폴리오 사이트(메인·층별 상세·스프레드시트·ERD·AI 챗봇·문서)를 만든다

| 항목 | 내용 |
|------|------|
| Subject | `feat(portfolio): Astro 포트폴리오 사이트(메인·층별 상세·스프레드시트·ERD·AI 챗봇·문서)를 만든다` |
| Full SHA | `e499efdaa5b4517436f6122d1f28366212028d8d` |
| Short SHA | `e499efd` |
| Branch | `feature/portfolio` |
| Parent | `51650ee` |
| Date | 2026-11-07 16:55:34 +0900 |

## 주 내용

- `PortFolio/frontend`: Astro 정적 사이트 10페이지(메인, 층별 상세 5, 기획 스프레드시트, ERD, AI 챗봇, 문서 내려받기)
- 챗봇: 브라우저 → Rails → Flask, 대화는 localStorage(여러 대화·내보내기·지우기), 근거 번호·그래프 단계·소요 시간 표시
- `.claude/launch.json`: 포트폴리오 웹·API·AI 미리보기 설정

## 상세

**배경**
사용자가 Astro 포트폴리오 사이트와 스프레드시트·ERD·AI 챗봇 페이지를 요청했다(2026-11-07).

**변경 범위**
`PortFolio/frontend/` 새 앱(스크린샷 34장, ERD SVG 6장 포함), `.claude/launch.json`.

**안 한 것**
`/files`가 가리키는 docx·pptx·pdf와 엑셀 복사본은 아직 만들지 않았다. 배포 설정도 아직.

## 결과

**동작 확인**
`astro build` 10페이지 통과. 미리보기에서 메인·상세·ERD 탐색기를 눈으로 확인하고 고쳤다(좁은 폭 메뉴, 버튼 색, 간트 날짜 NaN, 관계도 겹침). 챗봇 화면은 브라우저로 질문해 보지 않았다(Rails·Flask 경로는 앞 커밋에서 확인).

**리스크**
간트·관계도 수정 뒤 화면은 다시 보지 않았다(빌드만).

**후속**
문서 파일, 배포 구성, 웹 푸터 '프로젝트 소개', 노션 고도화, 병합.
