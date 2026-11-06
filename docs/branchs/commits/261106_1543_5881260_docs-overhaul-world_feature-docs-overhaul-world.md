# 월드코퍼챗과 2026-11-06 변경을 docs 전체에 반영

| 항목 | 내용 |
|------|------|
| Subject | `docs: 월드코퍼챗과 2026-11-06 변경을 docs 전체에 반영` |
| Full SHA | `58812601ba08058dfc3af6aead835ace69ac79a9` |
| Short SHA | `5881260` |
| Branch | `feature/docs-overhaul-world` |
| Parent | `7348a86` |
| Date | 2026-11-06 15:43:25 +0900 |

## 주 내용

- docs 루트(README·AGENT_HANDOVER·API_DOCUMENTATION·DEPLOYMENT·FEATURES·TASKS·WORKFLOW)와 Architecture·plan·guidance·find_debug·repeater·trainings·vaildates·web_management 문서를 월드코퍼챗과 2026-11-06 변경에 맞췄다
- 새 기록: `find_debug/2026-11-06.md`(7건), `repeater/heredoc-escape.md`

## 상세

**배경**
사용자 요청(2026-11-06): docs 루트와 Architecture ~ web_management 문서를 하나도 빠짐 없이, 지난 작업과 이번 작업에서 바뀐 것·직접 시험한 것을 반영해 고도화.

**변경 범위**
56개 문서. 수치 정정(테이블 28→37, 마이그레이션 33→34, 웹 화면 31→35, API 211→226, e2e 117→123, AI 단위 45→54, 평가 별도 6→7), 월드코퍼챗 절(API 표, 데이터 흐름, 계층, 화면 지도, DB 표, 하드코딩 값, 디자인, 운영 콘솔, 배포·백업·포트, 법률 확인 항목), 할 일 W01~W05, 플레이테스트 항목, 브랜치 쌓기 방식, 커밋 scope 예시, 디버깅 기록.

**기술 포인트**
수치는 저장소에서 다시 셌다(마이그레이션 폴더, schema의 model 수, page.tsx 수, 시험 실행 결과). 역사 기록(옛 find_debug·repeater·커밋 기록)은 그때의 사실이라 고치지 않았다.

**안 한 것**
기획 원본(`CodiComperChat_project_plan.md`)은 고치지 않았다.

## 결과

**동작 확인**
링크 검사 927개 깨짐 0. 에이전트 어댑터 시험 30개 통과.

**리스크**
개발 DB에는 월드 마이그레이션을 아직 적용하지 않았다고 인수인계에 적었다.

**후속**
없음.

**관련 문서**
[docs/README.md](../../README.md)
