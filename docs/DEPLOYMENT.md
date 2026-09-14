# 배포 (짧은 진입)

> 상태: **코드·인프라 미착수.** 정본은 [plan/DEVELOPMENT_AND_DEPLOYMENT_GUIDE.md](plan/DEVELOPMENT_AND_DEPLOYMENT_GUIDE.md) — 지금은 실제 절차가 아니라 목표 절차다.

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

- 인증 벤더
- 호스티드 LLM 벤더
- 실제 배포 대상(플랫폼/리전)

이 항목들이 정해지기 전까지 `web_management/`의 배포 문서는 체크리스트 수준으로만 유지한다.

상세: [web_management/pre-deploy.md](web_management/pre-deploy.md), [web_management/docker-deploy.md](web_management/docker-deploy.md)
