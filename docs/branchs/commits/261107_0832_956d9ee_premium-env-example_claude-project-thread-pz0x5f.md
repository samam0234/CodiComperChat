# 프리미엄(Claude·Grok) 환경변수를 샘플 .env에 추가

| 항목 | 내용 |
|------|------|
| Subject | `docs(deploy): 프리미엄(Claude·Grok) 환경변수를 샘플 .env에 추가` |
| Full SHA | `956d9eecf79e941c9f704924564173ca94103a23` |
| Short SHA | `956d9ee` |
| Branch | `claude/project-thread-pz0x5f` |
| Parent | `9c76e92` |
| Date | 2026-11-07 08:32:35 +0900 |

## 주 내용

- `deploy/oracle/.env.example`과 `services/ai/.env.example`에 `ANTHROPIC_API_KEY`, `XAI_API_KEY`, `PREMIUM_PROVIDERS`, `PREMIUM_MONTHLY_CREDITS`를 더했다

## 상세

**배경**
사용자가 이 브랜치의 .env 관련 작업을 봐 달라고 했고 Claude·xAI 키를 넣을 자리도 요청했다(2026-11-07). 점검해 보니 compose(`docker-compose.ai.yml`, `docker-compose.yml`)는 이미 이 값들을 컨테이너에 넘기고 있었지만 샘플 파일에 없었다.

**변경 범위**
샘플 파일 2개. 키 값은 모두 비어 있다.

**기술 포인트**
프리미엄이 열리려면 키, `PREMIUM_PROVIDERS`, 월 한도(0 초과) 세 가지가 모두 필요하다. 한도 0이면 키가 있어도 닫혀 있다(`apps/api/src/models/models.ts`).

**안 한 것**
실제 키는 넣지 않았다. 서버에 반영하지 않았다.

## 결과

**동작 확인**
`docker compose config`로 새 변수가 해석되는 것을 확인했다. 실제 호출은 키가 없어 확인하지 못했다.

**리스크**
키를 넣고 한도를 켜면 실제 돈이 나간다.

**후속**
서버 `.env`에 키 입력(사용자가 직접).
