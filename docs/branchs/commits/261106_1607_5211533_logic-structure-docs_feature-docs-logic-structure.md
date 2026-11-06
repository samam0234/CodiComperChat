# docs 전체 문서에 로직 구조 상자 그림 추가

| 항목 | 내용 |
|------|------|
| Subject | `docs: docs 전체 문서에 로직 구조 상자 그림 추가` |
| Full SHA | `5211533c24e7c7eff7b9a60d16430260e1d2c151` |
| Short SHA | `5211533` |
| Branch | `feature/docs-logic-structure` |
| Parent | `593c7e4` |
| Date | 2026-11-06 16:07:31 +0900 |

## 주 내용

- docs의 모든 문서(루트·Architecture·branchs·find_debug·guidance·plan·repeater·trainings·vaildates·web_management, 71개)에 "로직 구조" 상자 그림을 넣었다

## 상세

**배경**
사용자 요청(2026-11-06): 모든 md 파일에 로직 구조도, 어떤 구조로 가는지 정확히.

**변경 범위**
`docs/**/*.md` (커밋 기록 `docs/branchs/commits/`는 그때의 기록이라 제외).

**기술 포인트**
문서마다 그 문서가 설명하는 흐름을 그렸다: 대화 한 턴, 비밀 퀘스트 상태 이동, 월드 한 턴, 데이터 관계, 수위 판단 순서, 시험 층, 배포 순서, 백업·복구, 커밋 기록 흐름, 디버깅 일지의 원인→고침 등. 값은 코드와 대조했다(공방 8단계 이름, 환경변수 이름, build:verify, pg_dump -Fc, 포트).

**안 한 것**
글 본문은 바꾸지 않았다.

## 결과

**동작 확인**
대상 문서 108개 모두에 들어갔는지 스크립트로 확인(빠진 5개는 기획 원본과 Next 자동 생성 파일, 의도적). 링크 검사는 병합 전 다시 한다.

**리스크**
구조가 바뀌면 그림도 함께 고쳐야 한다.

**후속**
병합.

**관련 문서**
[docs/README.md](../../README.md)
