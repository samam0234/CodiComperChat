# Ollama 타임아웃 방지와 Vercel·Oracle·GPU 노드 배포 구성 추가

| 항목 | 내용 |
|------|------|
| Subject | `feat(deploy): Ollama 타임아웃 방지와 Vercel·Oracle·GPU 노드 배포 구성 추가` |
| Full SHA | `fae510e63c6b344439d5e34f67a859f85565eda4` |
| Short SHA | `fae510e` |
| Branch | `claude/project-thread-po3i10` |
| Parent | `a58c0e7` |
| Date | 2026-11-06 13:11:42 +0000 |

## 주 내용

- Ollama 호출을 스트리밍으로 바꿔 "토큰 사이 공백"에만 시간 제한을 건다(기본 600초, `OLLAMA_READ_TIMEOUT_SECONDS`). 모델이 계속 쓰는 동안은 끊지 않는다
- 기동 때 대화 모델 예열(`OLLAMA_WARMUP=1`)
- Nest의 AI 호출을 `node:http`로 바꿔 Node fetch의 숨은 300초 헤더 제한을 없애고, `AI_TIMEOUT_MS`(280초)·`AI_BACKGROUND_TIMEOUT_MS`(600초)·`AI_QUEUE_WAIT_MS`를 환경변수로 뺐다
- 웹·콘솔에 `maxDuration = 300`(Vercel Hobby 상한), `vercel.json`(서울 리전)
- 나눠 올리기 구성: `deploy/oracle/`(Caddy+API+Postgres, GPU 없을 때 `cpu-ai` 프로필), `deploy/ai-node/`(GPU 기계의 AI+Ollama)
- 한눈에 보는 안내 `docs/web_management/deploy-guide.html`

## 상세

**배경**
사용자가 배포를 요청하며 Ollama(gemma4:12b) 타임아웃이 나지 않게 하고, 프론트·콘솔은 Vercel/Cloudflare, 백엔드는 Oracle 또는 무료 24시간, AI는 Oracle 또는 무거운 모델을 타임아웃 없이 돌릴 곳을 골라 달라고 했다. 조사 결과 Oracle Always Free는 GPU가 없고 2026-06부터 ARM 한도가 2 OCPU·12GB로 줄어, AI는 GPU 기계를 Tailscale로 붙이는 안을 추천했다. Cloudflare 프록시·Tunnel은 100초에 끊어 API·AI 앞에 두지 않는다.

**변경 범위**
services/ai(llm.py, main.py, 시험), apps/api(ai-client.ts, ai-queue.ts, 시험), apps/web·console(레이아웃·AI 중계 라우트 maxDuration, client-ip.ts, vercel.json), deploy(oracle, ai-node, ai.Dockerfile), docs(DEPLOYMENT.md, environment.md, deploy-guide.html).

**기술 포인트**
- 타임아웃 순서: Vercel 300초 > `AI_TIMEOUT_MS` 280초. API가 먼저 끊어야 이용자에게 안내 문구가 나간다
- 웹이 다른 기계(Vercel)에 있으면 Caddy가 X-Forwarded-For를 Vercel 주소로 덮어써 IP 한도가 모든 이용자를 한 명으로 센다. 공유 비밀 `WEB_PROXY_TOKEN`이 맞는 요청만 웹이 넘긴 IP를 그대로 전달한다
- CPU 서버용 이미지는 `WITH_IMAGE=0`으로 torch·diffusers를 뺀다(그림 기능은 "준비 중"으로 잠긴다)

**안 한 것**
- 실제 서버 배포(Oracle 커넥터 미로그인, 백엔드 없이 프론트만 올리면 동작하지 않음)
- 브라우저까지의 스트리밍(답이 생기는 대로 화면에 보이기)은 범위가 커서 하지 않았다
- Caddyfile 문법 검사(caddy 바이너리를 받지 못함)

## 결과

**동작 확인**
- `npm run typecheck:api` 통과, `npm run test:api` 229 통과(새 ai-client 시험 6개 포함)
- AI 단위 시험 61개 통과(새 스트리밍 시험 7개: 느린 답이 읽기 제한보다 오래 걸려도 끊기지 않음, 공백 초과 504, 모델 없음 502 등)
- web·console `tsc --noEmit`, oxlint 통과
- `docker compose config`로 두 compose 파일 검사 통과, `bash -n deploy/oracle/setup.sh` 통과
- 실제 gemma4:12b·실제 Oracle VM·Vercel에서는 확인하지 않았다

**리스크**
- Caddy의 `header_up X-Forwarded-For` 덮어쓰기는 실제 서버에서 확인 전이다(안내 7단계에 확인 항목)
- Oracle 무료 VM은 7일 유휴 회수 규칙이 있다

**후속**
- Oracle VM을 만든 뒤 안내대로 올리고 실측(첫 답·이후 답 시간)을 trainings/ 또는 web_management/에 남긴다

**관련 문서**
- docs/web_management/deploy-guide.html, docs/DEPLOYMENT.md, docs/guidance/environment.md
