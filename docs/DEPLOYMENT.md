# 배포 (짧은 진입)

> 상태(2026-10-16): **코드는 동작하고, 배포는 아직이다**(사용자 지시로 마지막에 한다). 로컬 실행은 [guidance/getting-started.md](guidance/getting-started.md). 배포 때 정해야 할 것은 아래 "배포 때 꼭 할 것"과 [web_management/pre-deploy.md](web_management/pre-deploy.md).

## 목표 그림 (계획서 §7.3)

```text
repo/
├── apps/web/         # Next.js
├── apps/api/         # Nest.js
├── services/ai/      # FastAPI
└── docker-compose.yml
```

로컬은 compose로 web / api / ai / postgres / redis를 한 번에 올리는 것이 목표다. 배포는 web·api와 ai를 분리할 수 있게 둔다 — GPU/호스티드 LLM 비용이 커지는 시점에 ai만 따로 스케일한다 (계획서 §7.3).

## 지금 열려 있는 것 (계획서 §15 "아직 열린 것")

- 호스티드 LLM 벤더(개발은 로컬 Ollama) — 인증은 자체 이메일 로그인으로 정했다
- 실제 배포 대상(플랫폼/리전), 운영 메일 서비스, 토스 상점 계약

## 배포 때 꼭 할 것 (구현하며 남긴 메모)

| 무엇 | 왜 | 어디 |
|------|-----|------|
| 앞단 프록시가 `X-Forwarded-For`를 **덮어쓰게** | Nest는 `trust proxy 'loopback, linklocal, uniquelocal'`로 사설망에서 온 헤더를 믿는다. 바깥 값을 그대로 넘기면 IP 기준 요청 한도를 속일 수 있다 | `apps/api/src/main.ts` |
| 서버가 여러 대면 `RATE_LIMIT_STORE=db` | 메모리 한도는 대수만큼 늘어난다 | [guidance/environment.md](guidance/environment.md) |
| `AI_CONCURRENCY`를 대수로 나눠 정하기 | 대기열은 서버마다 따로다 | 〃 |
| `NODE_ENV=production` | 가짜 결제·개발용 메일 로그가 꺼지고, 쿠키가 https 전용, CSP에서 개발용 허용이 빠진다 | 〃 |
| `MAIL_SMTP_URL`·`WEB_BASE_URL` | 없으면 인증·재설정 메일이 안 나간다 | `npm run mail:check --workspace api` |
| `TOSS_SECRET_KEY`·`TOSS_CLIENT_KEY`(+ 가격) | 없으면 운영에서 결제를 열지 않는다 | `npm run billing:check --workspace api` |
| FastAPI를 바깥에 열지 않고 서비스 토큰으로 막기 | 지금은 내부망 전제라 인증이 없다(계획서 §7.8) | `services/ai` |
| `apps/api/data/personas/*.json` 옮기기 | git에 없다(발행하면 공방이 만든다). 서버를 새로 만들면 다시 발행하거나 파일을 옮긴다 | [`apps/api/data/personas/README.md`](../apps/api/data/personas/README.md) |
| https | CSP `upgrade-insecure-requests`, 쿠키 `secure` | |

이 항목들이 정해지기 전까지 `web_management/`의 배포 문서는 체크리스트 수준으로만 유지한다.

상세: [web_management/pre-deploy.md](web_management/pre-deploy.md), [web_management/docker-deploy.md](web_management/docker-deploy.md)
