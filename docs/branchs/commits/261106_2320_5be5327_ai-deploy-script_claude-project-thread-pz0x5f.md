# AI 서버 배포를 스크립트 한 개로 묶고 화면 예시를 더한다

| 항목 | 내용 |
|------|------|
| Subject | `feat(deploy): AI 서버 배포를 스크립트 한 개로 묶고 화면 예시를 더한다` |
| Full SHA | `5be5327860be01b461d31013bcdfd0dca13731d3` |
| Short SHA | `5be5327` |
| Branch | `claude/project-thread-pz0x5f` |
| Parent | `2054c5e` |
| Date | 2026-11-06 23:20:07 +0000 |

## 주 내용

- PC용 `scripts/deploy-ai-oracle.mjs`와 서버용 `deploy/oracle/ai-deploy.sh`로 배포를 한 명령으로 묶음
- 인수인계 md/html을 스크립트 기준으로 다시 씀 (정상 화면 예시, 실패 화면별 대처, Code 창 사용법)
- `ai-server-guide.html` 상단에 스크립트 안내 추가

## 상세

**배경**
사용자가 인수인계 가이드가 불친절하다며 샘플을 먼저 만들고 사용자가 판단·입력할 부분을 줄여 달라고 했다(2026-11-07).

**변경 범위**
scripts, deploy/oracle, docs/web_management. 앱 코드는 그대로다.

**기술 포인트**
키는 서버에서만 물어 `.env`에 저장하고 출력하지 않는다. 키를 저장하기 전에 NVIDIA에 실제 호출로 검사하고 모델 ID를 목록에서 찾아 맞춘다. 서버 스크립트는 중복 실행에 안전하다(`.env` 줄 교체, 스왑·모델은 있으면 건너뜀). PC 스크립트는 병합 전에는 PR 브랜치, 병합 후에는 main을 자동 선택한다. 업로드는 spawn 파이프로 해 PowerShell 5의 바이너리 파이프 문제를 피한다.

**안 한 것**
실제 서버 실행. 이 환경은 서버에 접속할 수 없다.

## 결과

**동작 확인**
모의 NVIDIA 서버와 가짜 docker·ssh로 시험했다: 키 없음+터미널 없음 실패 안내, 키 거절(401) 안내, 터미널에서 틀린 키 후 맞는 키 입력, 키 저장(.env에 1줄, 출력에 키 없음), 전체 흐름 6단계 통과와 요약, PC 스크립트 업로드→서버 실행 파이프. `bash -n`, `node --check` 통과.

**리스크**
실제 NVIDIA 응답 형식·모델 ID, ARM 빌드, 실제 compose 동작은 서버에서 처음 확인된다.

**후속**
사용자가 실행한 결과 화면을 받아 문제를 고친다.

**관련 문서**
docs/web_management/ai-deploy-handover.html · ai-deploy-handover.md
