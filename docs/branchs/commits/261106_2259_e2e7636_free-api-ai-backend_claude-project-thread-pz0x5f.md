# 무료 호스팅 API(NVIDIA NIM)로 대화하고 CPU Ollama를 예비로 둔다

| 항목 | 내용 |
|------|------|
| Subject | `feat(ai): 무료 호스팅 API(NVIDIA NIM)로 대화하고 CPU Ollama를 예비로 둔다` |
| Full SHA | `e2e7636c381642247e823c368c955517bf79405e` |
| Short SHA | `e2e7636` |
| Branch | `claude/project-thread-pz0x5f` |
| Parent | `80b6c21` |
| Date | 2026-11-06 22:59:47 +0000 |

## 주 내용

- 미병합 PR #2의 services/ai 변경(llm.py·main.py·.env.example·시험 2개)을 main 기준 브랜치로 옮김
- `deploy/oracle/docker-compose.ai.yml`에 NVIDIA NIM 기본값과 예비 설정 추가
- `deploy/oracle/.env.example`에 `LLM_BACKEND=openai`, `LLM_API_KEY` 추가
- `ai-server-guide.html`을 무료 API 방식으로 고치고 무료 GPU 조사 표 추가

## 상세

**배경**
사용자가 GPU 없는 CPU 구성은 의미가 없다며 무료 해결책을 요청했고, 결정 카드에서 "무료 API + CPU 예비"를 골랐다(2026-11-07).

**변경 범위**
services/ai, deploy/oracle, docs/web_management. Nest·웹 코드는 건드리지 않았다.

**기술 포인트**
main의 services/ai는 PR #2의 기준점 이후 바뀌지 않아 파일을 그대로 가져왔다. API 대기를 45초로 줄여, Nest의 130초 제한 안에 CPU 예비가 답할 시간을 남겼다.

**안 한 것**
PR #2의 Nest 타임아웃(node:http)·Vercel maxDuration·ai-node 구성은 옮기지 않았다. 그림 기능은 잠긴 채다.

## 결과

**동작 확인**
services/ai 시험 71개 통과. compose 병합 결과에서 LLM_* 값 확인. 안내서 390px 폭에서 가로 넘침 없음.

**리스크**
NIM 모델 ID(`google/gemma-4-31b-it`)는 클라우드에서 NVIDIA에 접속하지 못해 확인하지 못했다. 서버에서 확인한다.

**후속**
사용자가 키를 넣으면 서버에 배포하고 실제 대화를 확인한다.

**관련 문서**
docs/web_management/ai-server-guide.html
