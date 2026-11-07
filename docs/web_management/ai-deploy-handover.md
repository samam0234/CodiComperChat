# AI 서버 배포 인수인계 (Code 창용)

> 이 문서를 읽는 에이전트(Claude Code)에게: 사용자 PC의 Code 창에서 이어받아 **Oracle VM에 AI 서버를 올린다.** 2026-11-07. 사용자는 간결한 설명을 선호한다. **배포는 스크립트 한 개로 끝난다. 명령을 직접 하나씩 짜지 말고 아래 스크립트를 실행한다.**

## 0. 지킬 것

- `.claude/CLAUDE.md`, `docs/AGENT_HANDOVER.md`의 약속을 따른다. **병합은 사용자가 "병합"이라고 할 때만, 푸시는 요청할 때만.** 개발 서버를 켜거나 끄지 않는다.
- **NVIDIA API 키(`nvapi-…`)를 사용자에게 묻지 않는다.** 채팅·로그·파일·커밋에 남기지 않는다. 스크립트도 키를 출력하지 않는다. 사용자가 `--key-only`로 직접 넣는다(3단계).
- 지금 작업 브랜치와 사용자의 수정 중인 파일을 건드리지 않는다. 배포 코드는 별도 worktree에서 꺼낸다.

## 1. 지금 상태

| 항목 | 상태 |
|------|------|
| 백엔드(API+DB+Caddy) | Oracle VM에 배포 완료 (`ssh codicomper-oci`, 서버 폴더 `~/codicomperchat`) |
| 웹·콘솔 | Vercel, 바꿀 것 없음 |
| AI 서버 | **이 문서의 할 일.** 대화는 NVIDIA NIM 무료 API(Gemma 4 31B), 막히면 VM의 CPU Ollama `gemma4:e4b` |
| 코드 위치 | `origin/main` (PR #3 병합됨, 스크립트가 자동 선택) |
| 그림 기능 | GPU가 없어 "준비 중"으로 잠김. 정상 |

## 2. 스크립트 두 개

| 파일 | 어디서 | 하는 일 |
|------|--------|---------|
| `scripts/deploy-ai-oracle.mjs` | PC | `git fetch`, 서버로 코드 업로드(`git archive | ssh tar`, LF 고정, 서버 `.env` 안 덮어씀), 서버의 `ai-deploy.sh` 실행. `--key-only`, `--dry-run`, `--host`, `--ref` 옵션 |
| `deploy/oracle/ai-deploy.sh` | 서버 | 키 검사·저장(없으면 물음) → NVIDIA 모델 ID 확인 → 스왑 → compose up → 예비 모델 받기 → 확인 3가지. 여러 번 돌려도 안전 |

## 3. 순서

### 3-1. 코드 꺼내기 (사용자의 작업 폴더를 건드리지 않음)

```bash
cd D:/vscode/CodiComperChat
git fetch origin main
git worktree list | grep ccc-ai-deploy || git worktree add ../ccc-ai-deploy origin/main
cd ../ccc-ai-deploy && git checkout --detach origin/main
```

### 3-2. 키 확인

```bash
node scripts/deploy-ai-oracle.mjs --dry-run      # 명령이 올바른지만 본다
ssh codicomper-oci "sudo grep -c '^LLM_API_KEY=nvapi-' ~/codicomperchat/deploy/oracle/.env"
```

- 마지막 줄이 `1`이면 키가 이미 있다 → 3-3으로.
- `0`이거나 파일이 없으면 **멈추고** 사용자에게 알린다: "PowerShell에서 `cd D:\vscode\ccc-ai-deploy; node scripts/deploy-ai-oracle.mjs --key-only`를 실행해 키를 붙여 넣고 `키 설정 끝`이 나오면 알려 주세요." 키를 대신 받지 않는다. (Code 창에는 키를 입력할 터미널이 없다.)

### 3-3. 배포 실행

```bash
node scripts/deploy-ai-oracle.mjs
```

- ARM에서 처음 빌드와 모델 받기로 **5~15분** 걸린다. 도구 제한 시간이 있으면 `run_in_background`로 돌리고 출력을 끝까지 본다.
- 중간에 API가 한 번 다시 켜져 사이트가 수십 초 끊긴다. 사용자에게 미리 한 줄 알린다.

## 4. 성공 화면 (이렇게 끝나면 성공)

```text
== 코디컴퍼챗 AI 서버 배포 ==
[1/6] 사전 점검
  ✓ docker, .env, compose 파일 확인
[2/6] NVIDIA 키
  ✓ 키 확인됨 (모델 google/gemma-4-31b-it, HTTP 200)
  ✓ .env에 저장 (키 값은 출력하지 않음)
[3/6] 메모리·스왑
  ✓ 스왑 4GB를 만들었다
[4/6] 컨테이너 빌드·시작 ...
  ✓ 컨테이너 시작
  ✓ ai 컨테이너 healthy
[5/6] 예비 모델 gemma4:e4b (CPU)
  ✓ 받았다
[6/6] 확인
  ✓ api → ai 내부 호출 통과 (토큰 인증)
  ✓ NVIDIA 응답: 1.8초 | 안녕하세요! ...
  ✓ 예비(CPU) 응답: 41.0초 | 안녕하세요.

== 완료: 모두 통과 ==
```

시간·문장은 달라도 된다. `== 완료: 모두 통과 ==`가 마지막이고 종료 코드가 0이면 성공이다.

## 5. 실패 화면별 대처

| 화면 | 뜻 | 할 일 |
|------|-----|-------|
| `✗ 백엔드 설정 파일이 없다` | 서버에 `deploy/oracle/.env`가 없음 | 백엔드 배포(`docs/web_management/oracle-backend.md`)가 안 된 것. 사용자에게 알린다 |
| `✗ 키가 .env에 없고 입력할 터미널도 없다` | 키 없음 | 3-2의 안내대로 사용자가 `--key-only` |
| `✗ NVIDIA가 키를 거절했다(HTTP 401)` | 키가 틀리거나 만료 | 사용자가 build.nvidia.com에서 새 키 → `--key-only` |
| `! NVIDIA 모델 목록에 Gemma 4 31B가 없다` + `gemma 계열: …` | 모델 이름 변경 | 목록을 사용자에게 보여 주고 어떤 모델을 쓸지 묻는다. 정해지면 서버 `.env`의 `LLM_API_MODEL=`을 `sudo sed -i`로 고치고 3-3 재실행. Google AI Studio 대안은 `LLM_API_BASE`·`LLM_API_MODEL`·`LLM_API_KEY` 교체 |
| `✗ ai가 healthy가 되지 않았다` + 로그 | 컨테이너 문제 | 로그를 읽고 원인을 찾는다. `AI_SERVICE_TOKEN`(32자 이상), 램·스왑(`free -h`)부터 확인 |
| `✗ NVIDIA 경로 실패: …` | API 호출 실패 | 메시지(401, 429 한도, 시간 초과)를 사용자에게 전달. 429는 잠시 후 재실행 |
| `! 예비(CPU) 응답 실패` | CPU 예비가 느리거나 실패 | 경고일 뿐. NVIDIA가 막힐 때만 문제. 사용자에게 알리고 넘어간다 |
| `서버에 접속하지 못했다` | ssh 문제 | 사용자가 `ssh codicomper-oci`로 접속되는지 확인 |

되돌리기: `ssh codicomper-oci "cd ~/codicomperchat && sudo docker compose --env-file deploy/oracle/.env -f deploy/oracle/docker-compose.yml -f deploy/oracle/docker-compose.ai.yml stop ai ollama"` (API·DB는 그대로 돈다)

## 6. 끝났을 때

1. 사용자에게 마지막 `== 완료 ==` 줄과 `NVIDIA 응답` 줄만 간결히 보고한다. 병합은 사용자가 말할 때만 한다.
2. 사용자에게 Vercel 웹에서 캐릭터와 대화해 보도록 안내한다.
3. 정리(선택): `cd D:/vscode/CodiComperChat && git worktree remove ../ccc-ai-deploy`
4. 실제로 서버 설정이 바뀌었다면(예: `LLM_API_MODEL`) 사용자가 원할 때 `deploy/oracle/.env.example`·가이드에 반영하는 커밋을 `feature/*` 규칙대로 만든다(커밋 기록 포함).

설명서(사용자용): `docs/web_management/ai-deploy-handover.html`
