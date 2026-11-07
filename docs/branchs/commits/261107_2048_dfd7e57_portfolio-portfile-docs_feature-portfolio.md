# 포트폴리오 문서(docx·pdf·pptx)를 콘텐츠 정본에서 만든다

| 항목 | 내용 |
|------|------|
| Subject | `feat(portfolio): 포트폴리오 문서(docx·pdf·pptx)를 콘텐츠 정본에서 만든다` |
| Full SHA | `dfd7e570da2cff440575efdcb23c5f6551cf7ea1` |
| Short SHA | `dfd7e57` |
| Branch | `feature/portfolio` |
| Parent | `bd2e02f` |
| Date | 2026-11-07 20:48:59 +0900 |

## 주 내용

- `PortFolio/scripts/build_portfile.py`: 콘텐츠 정본 + 스크린샷 → `PortFile/CodiComperChat_Portfolio.docx`(1.3MB) · `.pdf`(A4 18쪽) · `.pptx`(16:9 14장)
- 같은 파일을 `frontend/public/files`에 복사하고, 엑셀은 `CodiComperChat_planning.xlsx`로 복사해 사이트 `/files`·`/data`의 내려받기와 잇는다

## 상세

**배경**
사용자가 포트폴리오 결과물로 docx·ppt·pdf 파일을 PortFile에 두라고 했다(2026-11-07).

**변경 범위**
생성기, 결과 파일 4개(+사이트 복사본).

**기술 포인트**
문서·PDF는 표지 → 목차 → 프로젝트 → 층별(개요·엔진·기능·API·화면·디자인·문제·미래) 순서. 발표 자료는 한 장에 한 메시지(표지·목차·차별점·규모·기능·구조·층별 5장·평가·이 사이트·마무리). 세로로 긴 화면은 높이에 맞춰 줄인다.

**안 한 것**
문서 안의 숫자는 콘텐츠 정본 그대로이며 따로 다시 재지 않았다.

## 결과

**동작 확인**
PDF 1·3·6쪽을 그림으로 그려 보고, 이 PC의 PowerPoint로 슬라이드 1·3·7·8을 내보내 확인했다(그림 설명 위치를 고침).

**리스크**
맑은 고딕이 없는 OS에서는 FONT_PATH를 줘야 PDF 한글이 나온다.

**후속**
배포 구성.
