# docs: 전체 문서를 현재 구현에 맞게 갱신

| 항목 | 내용 |
|------|------|
| Subject | `docs: 전체 문서를 현재 구현에 맞게 갱신` |
| Full SHA | `566be03735630bb1f296fec907c0e88d5064ce1c` |
| Short SHA | `566be03` |
| Branch | `feature/docs-overall-update` |
| Parent | `24a52d4` (develop) |
| Date | 2026-10-25T00:04:27+09:00 |

## 주 내용

- 루트 README를 "뼈대 단계"에서 현재 상태(기능 표·구조·파트 소개·시작 방법·시험)로 다시 작성
- docs 전반을 코드와 대조해 갱신: 아키텍처(overview·layers·apps·data-flow·docker-topology), 계획(CURRENT_STACK·DATABASE·TESTING·PROJECT_STRUCTURE·HARDCODING_ZONES·AI_MODEL_STRATEGY·LOGIC_STRUCTURE·개발배포 가이드), 가이드(getting-started·operations·ai-pipeline·studio-workshop·web-frontend·photonet-engine·api-usage), API 문서(FastAPI 경로·요청 한도·summarize quest), 배포·운영(DEPLOYMENT·WORKFLOW·pre-deploy·ports·docker-deploy)
- 앱별 README(api·web·ai·e2e) 정정 — 모듈·경로·환경변수·20개 e2e 파일 표
- 수치 정정: 테이블 15→27, 마이그레이션 31, API 단위 185, e2e 105, evals 9묶음, 화면 31
- getting-started의 `scriptsstart-sd-webui.cmd`(역슬래시 누락) 오타 수정

## 상세

**배경**
사용자 지시("문서 전체적으로 업데이트", 현재 구축된 기반의 내용을 잘 반영하도록).

**변경 범위**
README.md, docs/**, apps/api·apps/web·services/ai·e2e README

**기술 포인트**
- 환경변수는 코드의 process.env·os.environ 사용처와 대조해 environment.md에 빠진 것이 없음을 확인
- 문서 57개의 상대 링크를 스크립트로 검사 — 깨진 링크 0
- 수치는 코드·DB 스키마·시험 파일에서 직접 센 값(테이블 27=모델 수, 마이그레이션 31, e2e 파일 20, 화면 31)
- docs/branchs/commits와 find_debug·trainings는 기록용이라 손대지 않음

**안 한 것**
.agents/skills/codicomperchat/SKILL.md·AGENTS.md는 기획 원본에서 파생된 규칙 정본이라 손대지 않음(Redis 1순위 같은 기획 시점 문구가 남아 있음 — 사용자 확인 필요). docs/trainings·find_debug의 옛 기록

## 결과

**동작 확인**
- oxlint --deny-warnings(CI 명령) 통과
- 문서 상대 링크 검사 0건
- 코드 변경 없음(문서·LICENSE·SECURITY·THIRD_PARTY_NOTICES만)

**리스크**
없음

**후속**
develop 병합, 푸시

**관련 문서**
README.md, docs/ 전체
