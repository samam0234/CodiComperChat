# Code 창 인수인계 문서와 안내 HTML 추가

| 항목 | 내용 |
|------|------|
| Subject | `docs(deploy): Code 창 인수인계 문서와 안내 HTML 추가` |
| Full SHA | `2555a4df972d18bb6de26836b4234aba0a3fbad2` |
| Short SHA | `2555a4d` |
| Branch | `claude/project-thread-pz0x5f` |
| Parent | `5187848` |
| Date | 2026-11-06 23:12:32 +0000 |

## 주 내용

- Code 창(Claude Code)용 인수인계 지시서 `ai-deploy-handover.md` 추가
- 사용자용 설명 `ai-deploy-handover.html` 추가 (역할 분담, 키 안전수칙, 키 넣는 법, 붙여 넣을 문장)
- `ai-server-guide.html` 3단계의 접속 줄과 붙여 넣는 상자를 분리

## 상세

**배경**
사용자가 NVIDIA 키를 만들었고, Code 창에서 서버 배포를 이어서 하도록 인수인계 문서를 요청했다(2026-11-07).

**변경 범위**
docs/web_management만. 코드·배포 파일은 그대로다.

**기술 포인트**
키는 사용자가 서버에서 `read -rs`로 직접 넣고 에이전트는 `grep -c`로 개수만 센다. PR #3 브랜치가 병합 전이라 Code 창은 `git fetch` 후 `git show`로 문서를 읽고, `git archive`로 원격 브랜치를 서버로 보낸다(작업 브랜치 변경 없음). NIM 모델 ID는 서버에서 확인하는 단계를 넣었다.

**안 한 것**
서버 배포 자체, 병합, 키 취급.

## 결과

**동작 확인**
HTML을 390px·1100px 폭으로 렌더해 가로 넘침 없음 확인. 서버 명령은 이 환경에서 실행하지 못했다(원격 접속 불가).

**리스크**
인수인계 문서의 ssh 인용 구문은 실제 서버에서 처음 실행된다.

**후속**
Code 창 배포 결과 확인 후 사용자가 병합을 지시하면 develop→main(--no-ff).

**관련 문서**
docs/web_management/ai-server-guide.html
