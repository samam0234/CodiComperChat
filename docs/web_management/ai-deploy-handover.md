# AI 서버 배포 인수인계 (Code 창용)

> 이 문서를 읽는 에이전트(Claude Code)에게: 사용자 PC의 Code 창에서 이어받아 **Oracle VM에 AI 서버를 올린다.** 2026-11-07 작성. 사용자는 간결한 설명을 선호한다. 사용자가 입력해야 하는 것은 맨 아래 "사용자 몫" 한 가지뿐이다.

## 0. 먼저 지킬 것

- `.claude/CLAUDE.md`와 `docs/AGENT_HANDOVER.md`의 약속을 따른다. 특히 **병합은 사용자가 "병합"이라고 할 때만, 푸시는 요청할 때만** 한다. 개발 서버를 켜거나 끄지 않는다.
- **NVIDIA API 키(`nvapi-…`)를 사용자에게 묻지 않는다.** 채팅·로그·파일·커밋에 키를 남기지 않는다. 키는 사용자가 서버 `.env`에 직접 넣는다(아래 4단계). 에이전트는 키가 들어갔는지만 `grep -c`로 센다.
- 서버 접속: `ssh codicomper-oci` (Ubuntu 24.04, ARM A1, 사용자 `ubuntu`). 서버 코드 위치 `~/codicomperchat`. 키·접속 설정은 사용자 PC(`~/.ssh`, `C:\Users\User\.oci`)에 있다.
- 일이 끝나면 결과(성공·실패, 로그 한두 줄)를 사용자에게 보고한다.

## 1. 지금 상태

| 항목 | 상태 |
|------|------|
| 백엔드(API+DB+Caddy) | 이미 Oracle VM에 배포 완료 (`deploy/oracle/docker-compose.yml`) |
| 웹·콘솔 | Vercel, 바꿀 것 없음 |
| AI 서버 | **아직 안 올림. 이 문서의 할 일** |
| 코드 위치 | PR #3 브랜치 `claude/project-thread-pz0x5f` (아직 main에 병합 안 됨) |
| 서버의 `.env` | `deploy/oracle/.env` (비밀값은 서버에만 있고 배포로 덮어쓰지 않음) |

## 2. 무엇을 올리나

- `deploy/oracle/docker-compose.ai.yml`: `ai`(FastAPI) + `ollama`(CPU 예비). 둘 다 내부망, 바깥 포트 없음.
- 대화: **NVIDIA NIM 무료 API(Gemma 4 31B)**. 한도·장애·45초 초과면 **CPU Ollama `gemma4:e4b`**가 대신 답한다.
- 그림 기능(코디포토넷·웹툰·AI 초상)은 GPU가 없어 "준비 중"으로 잠긴다. 정상.
- 정본 설명: `docs/web_management/ai-server-guide.html`.

## 3. 코드 올리기 (에이전트)

PC의 저장소(`D:\vscode\CodiComperChat`)에서. 작업 중인 브랜치를 바꾸지 않으려고 `git archive`로 원격 브랜치를 그대로 보낸다.

```bash
git fetch origin claude/project-thread-pz0x5f
git -c core.autocrlf=false -c core.eol=lf archive --format=tar origin/claude/project-thread-pz0x5f \
  | ssh codicomper-oci "mkdir -p ~/codicomperchat && tar -x -C ~/codicomperchat"
```

(CRLF가 섞이면 `.env` 값 끝에 `\r`이 붙는다. 위처럼 `core.eol=lf`를 줘야 한다.) 확인:

```bash
ssh codicomper-oci "ls ~/codicomperchat/deploy/oracle/; tr -cd '\r' < ~/codicomperchat/deploy/oracle/docker-compose.ai.yml | wc -c"   # 마지막 숫자가 0이면 정상
```

## 4. 키 넣기 (사용자 몫, 에이전트는 확인만)

사용자가 자기 터미널에서 `ssh codicomper-oci` 한 뒤 `docs/web_management/ai-server-guide.html` 3단계의 상자를 붙여 넣는다(키는 `read -rs`로 입력해 화면과 기록에 남지 않는다). 에이전트는 아래로 **들어갔는지만** 확인한다.

```bash
ssh codicomper-oci "sudo grep -c '^LLM_API_KEY=nvapi-' ~/codicomperchat/deploy/oracle/.env"   # 1이어야 함
ssh codicomper-oci "sudo grep -E '^(LLM_BACKEND|AI_CONCURRENCY|OLLAMA_MODEL)=' ~/codicomperchat/deploy/oracle/.env"
```

- 0이 나오면 멈추고 사용자에게 "4단계를 먼저 해 주세요"라고 알린다. 키를 대신 받아 적지 않는다.
- 값 `LLM_BACKEND=openai`, `AI_CONCURRENCY=2`가 보여야 한다.

## 5. 모델 ID 확인 (중요, 미확인 항목)

기본값 `LLM_API_MODEL=google/gemma-4-31b-it`는 클라우드에서 NVIDIA에 접속하지 못해 **확인하지 못했다.** 서버에서 확인한다(키는 화면에 안 찍힌다).

```bash
ssh codicomper-oci 'bash -s' <<'EOT'
cd ~/codicomperchat
K=$(sudo grep '^LLM_API_KEY=' deploy/oracle/.env | cut -d= -f2-)
curl -s -m 20 -H "Authorization: Bearer $K" https://integrate.api.nvidia.com/v1/models | grep -o 'google/gemma[^"]*'
EOT
```

- 목록에 `google/gemma-4-31b-it`가 있으면 그대로 간다.
- 다른 이름(예: `google/gemma-4-31b`)이면 서버 `.env`에 `LLM_API_MODEL=<찾은 이름>`을 더한다(`sudo sed -i '/^LLM_API_MODEL=/d'` 후 `echo … | sudo tee -a`). 응답이 401이면 키가 틀린 것이니 사용자에게 알린다.
- Gemma 계열이 목록에 없으면 멈추고 사용자에게 알린다(대안: Google AI Studio, `LLM_API_BASE`·`LLM_API_MODEL`·`LLM_API_KEY`만 교체).

## 6. 띄우기

```bash
ssh codicomper-oci 'cd ~/codicomperchat && C="sudo docker compose --env-file deploy/oracle/.env -f deploy/oracle/docker-compose.yml -f deploy/oracle/docker-compose.ai.yml" && $C up -d --build && $C ps'
```

- ARM에서 ai 이미지를 처음 빌드하느라 몇 분 걸린다. 시간이 길면 `run_in_background`로 돌리고 로그를 본다.
- api는 설정이 바뀌어 한 번 다시 켜진다(수십 초 끊김). 사용자에게 미리 알린다.
- 스왑이 없으면(`swapon --show`가 비면) 먼저 4GB 스왑을 만든다: `docs/web_management/ai-server-guide.html` 1단계.

## 7. 예비 모델 받기 (처음 한 번)

```bash
ssh codicomper-oci 'cd ~/codicomperchat && sudo docker compose --env-file deploy/oracle/.env -f deploy/oracle/docker-compose.yml -f deploy/oracle/docker-compose.ai.yml exec ollama ollama pull gemma4:e4b'
```

수 GB라 몇 분 걸린다. 끝나면 `ollama list`로 확인.

## 8. 확인 (모두 통과해야 끝)

```bash
C='sudo docker compose --env-file deploy/oracle/.env -f deploy/oracle/docker-compose.yml -f deploy/oracle/docker-compose.ai.yml'
# a) 컨테이너 상태: ai healthy, ollama Up, api healthy
ssh codicomper-oci "cd ~/codicomperchat && $C ps"
# b) api → ai 내부 호출 (토큰 인증 통과)
ssh codicomper-oci "cd ~/codicomperchat && $C exec api node -e \"fetch('http://ai:8000/health',{headers:{'x-ai-token':process.env.AI_SERVICE_TOKEN}}).then(r=>r.text()).then(console.log)\""
# c) 실제 코드 경로로 NVIDIA 응답 받기 (한 문장이 나오면 성공)
ssh codicomper-oci "cd ~/codicomperchat && $C exec ai python -c \"from app.services import llm; print(llm.generate(system='한국어로 한 문장만 답한다.', contents=[llm.turn('user','안녕')], max_output_tokens=60))\""
# d) 로그에 키·401 오류가 없는지
ssh codicomper-oci "cd ~/codicomperchat && $C logs --tail=40 ai"
```

- c)가 몇 초 안에 한국어 한 문장을 내면 NVIDIA 경로 성공. 오래 걸리고 답이 나오면 예비(CPU)로 넘어간 것이니 d) 로그와 5단계를 다시 본다.
- 마지막으로 사용자에게 Vercel 웹에서 캐릭터와 대화해 보게 한다.

## 9. 문제가 생기면

| 증상 | 할 일 |
|------|------|
| ai가 계속 재시작, "운영 안전 검사" | `.env`의 `AI_SERVICE_TOKEN`(32자 이상) 확인 |
| 401 / 키 오류 | 사용자가 4단계를 다시(키 재발급 포함), 이후 `$C up -d ai` |
| 대화가 느리고 가끔 끊김 | NVIDIA 한도(분당 약 40회)·장애로 예비가 답하는 중. `$C logs ai` |
| 모델 못 찾음(Ollama) | 7단계 `ollama pull gemma4:e4b` |
| 램 부족, ollama 종료 | 스왑 확인(`swapon --show`), `OLLAMA_WARMUP=0`을 `.env`에 추가 |
| 되돌리기 | `$C stop ai ollama` (API·DB는 그대로 돈다) |

## 10. 끝났을 때

1. 사용자에게 8단계 결과를 간결히 보고한다. 병합은 하지 않는다.
2. 실제로 바꾼 서버 설정이 있으면(예: `LLM_API_MODEL`) 사용자에게 알리고, 사용자가 원하면 `deploy/oracle/.env.example`·가이드에 반영하는 커밋을 `feature/*` 규칙대로 만든다(커밋 기록 포함).
3. 사용자가 "병합"이라고 하면 그때 `develop`→`main`(`--no-ff`)으로 PR #3을 처리한다.

## 사용자 몫 (딱 이것만)

- 4단계: 자기 터미널에서 `ssh codicomper-oci` 후 3단계 상자(키 입력)를 붙여 넣기. `1`이 나오면 에이전트에게 "키 넣었어"라고 말하기.
