# develop into main

| 항목 | 내용 |
|------|------|
| Subject | `merge: develop into main` |
| Full SHA | `d2e1f2b92ba8e4687eeea5b42327f66f5ad2403d` |
| Short SHA | `d2e1f2b` |
| Branch | `main` |
| Parent | `58028ce, f027a56` |
| Date | 2026-11-07 09:12:50 +0900 |

## 주 내용

- `origin/claude/project-thread-po3i10`(Vercel 웹 연동, AI 타임아웃 사슬, 무료 호스팅 API 백엔드, Oracle·AI 노드 안내 문서)를 main에 병합했다

## 상세

**배경**
사용자가 이 브랜치도 병합하라고 했다(2026-11-07). 같은 `deploy/oracle/`에 이미 병합된 다른 브랜치와 충돌이 났고, 사용자가 "서버 구성 유지"를 골랐다.

**변경 범위**
충돌 5건: `deploy/oracle/docker-compose.yml`·`Caddyfile`·`.env.example`은 서버에서 검증한 쪽을 유지했다. `services/ai/.env.example`은 양쪽을 합쳤고, `docs/DEPLOYMENT.md`는 현재 상태 문단을 유지하고 상대 안내를 "대안, 서버에 안 올림" 행으로 더했다. 상대의 `bootstrap.sh`·`setup.sh`·`deploy/ai-node/`·`console/vercel.json`·`apps/web/vercel.json`·웹 라우트 타임아웃·`ai-client.ts`·`ai-queue.ts`는 그대로 들어왔다.

**기술 포인트**
상대의 `bootstrap.sh`와 안내 HTML은 `WEB_PROXY_TOKEN`이 들어간 단일 compose를 전제로 쓰였다. 지금 서버의 compose와 맞지 않아 그대로 돌리지 않는다(DEPLOYMENT.md에 적음). Vercel에 웹을 올릴 때 프록시 토큰 구성을 따로 맞춘다.

**안 한 것**
서버에는 반영하지 않았다. 푸시는 병합 기록 뒤에 한다.

## 결과

**동작 확인**
병합 커밋 전에 시험했다: API vitest 232개(파일 31), AI unittest 71개, API·웹 타입 검사, compose config 통과. e2e는 돌리지 않았다.

**리스크**
API의 AI 타임아웃(`ai-client.ts`)이 바뀌었다. 서버가 쓰는 코드는 아직 이전 버전이다.

**후속**
서버에 반영할 때 `AI_TIMEOUT_MS` 기본값(280초)을 확인한다. Vercel 웹 배포 때 프록시 토큰 구성.
