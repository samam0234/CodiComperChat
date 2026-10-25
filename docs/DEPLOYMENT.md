# 배포 (짧은 진입)

> 상태(2026-10-24): **코드는 동작하고, 배포는 아직이다**(사용자 지시로 마지막에 한다). 로컬 실행은 [guidance/getting-started.md](guidance/getting-started.md). 배포 때 정해야 할 것은 아래 "배포 때 꼭 할 것"과 [web_management/pre-deploy.md](web_management/pre-deploy.md). **공개 전에 반드시 끝낼 보안·법률 항목은 [../SECURITY.md](../SECURITY.md) "공개 전 필수"와 [../THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md)(모델 라이선스)** 가 정본이다.

## 목표 그림 (계획서 §7.3)

```text
repo/
├── apps/web/         # Next.js 이용자 사이트
├── apps/api/         # Nest.js
├── console/          # Next.js 운영 콘솔 (바깥에 열지 않는다)
├── services/ai/      # FastAPI (+ 그림 엔진, GPU)
└── docker-compose.yml   # postgres · mailpit (개발용)
```

배포는 web·api와 ai를 분리할 수 있게 둔다 — GPU(그림 엔진)/호스티드 LLM 비용이 커지는 시점에 ai만 따로 스케일한다 (계획서 §7.3). Redis는 쓰지 않는다(요청 한도는 메모리 또는 PostgreSQL, AI 대기열은 프로세스 메모리). 컨테이너 이미지·compose 운영 구성은 아직 만들지 않았다(개발 compose는 DB·메일뿐).

## 지금 열려 있는 것 (계획서 §15 "아직 열린 것")

- 호스티드 LLM 벤더(개발은 로컬 Ollama) — 인증은 자체 이메일 로그인으로 정했다
- 실제 배포 대상(플랫폼/리전), 운영 메일 서비스, 토스 상점 계약(결제는 보류)
- **그림 엔진을 어디서 돌릴지**(GPU 서버 — 아래), 성인 모드 공개 여부(모델 사용 정책·본인인증 법률 검토)

## 배포 때 꼭 할 것 (구현하며 남긴 메모)

| 무엇 | 왜 | 어디 |
|------|-----|------|
| 앞단 프록시가 `X-Forwarded-For`를 **덮어쓰게** | Nest는 `trust proxy 'loopback, linklocal, uniquelocal'`로 사설망에서 온 헤더를 믿는다. 바깥 값을 그대로 넘기면 IP 기준 요청 한도를 속일 수 있다 | `apps/api/src/main.ts` |
| 서버가 여러 대면 `RATE_LIMIT_STORE=db` | 메모리 한도는 대수만큼 늘어난다 | [guidance/environment.md](guidance/environment.md) |
| `AI_CONCURRENCY`를 대수로 나눠 정하기 | 대기열은 서버마다 따로다 | 〃 |
| `NODE_ENV=production` | 가짜 결제·개발용 메일 로그가 꺼지고, 쿠키가 https 전용, CSP에서 개발용 허용이 빠진다 | 〃 |
| 개발용 스위치 끄기 | `LLM_FAKE`·`IMAGE_FAKE`·`MODEL_PREMIUM_FAKE`·가짜 결제·`MAIL_OUTBOX_DIR`·Mailpit | [../SECURITY.md](../SECURITY.md) |
| HSTS·HTTPS | `REQUIRE_HTTPS=1`이면 공개 호스트의 http를 https로 보내고 HSTS를 붙인다. 인증서와 `X-Forwarded-Proto` 덮어쓰기는 앞단 프록시(배포 대상 결정 후) | `apps/api/src/security/https.ts`, `apps/web/proxy.ts`, `console/proxy.ts` |
| `MAIL_SMTP_URL`·`WEB_BASE_URL` | 없으면 인증·재설정 메일이 안 나간다 | `npm run mail:check --workspace api` |
| `TOSS_SECRET_KEY`·`TOSS_CLIENT_KEY`(+ 가격) | 없으면 운영에서 결제를 열지 않는다 | `npm run billing:check --workspace api` |
| FastAPI를 바깥에 열지 않고 서비스 토큰으로 막기 | 지금은 내부망 전제라 인증이 없다(계획서 §7.8) | `services/ai` |
| **그림 엔진(`IMAGE_ENGINE=local`, 기본)** | services/ai 프로세스가 GPU에서 diffusers로 직접 그린다. 필요한 것: NVIDIA GPU(그래픽 메모리 12GB 권장, 8GB 이하는 `SD_OFFLOAD=1`), `pip install -r requirements-image.txt`(PyTorch CUDA, 수 GB), 체크포인트 두 파일을 `SD_MODEL_DIR`(기본 `services/ai/models/`)에 — 저장소에 없다. 첫 실행 때 모델 구성 파일(수십 KB)을 Hugging Face에서 받으므로 인터넷이 필요하다(이후엔 캐시). GPU가 없는 서버면 코디포토넷·웹툰은 "준비 중"으로 잠기고 나머지는 돈다. LLM(Ollama)과 그래픽 메모리를 나눠 쓰므로 서버가 따로면 둘 다 감당할 GPU가 필요하다 | [guidance/photonet-engine.md](guidance/photonet-engine.md) |
| 모델 파일·라이선스 | 모델 가중치는 저장소 밖에서 안전하게 받아 배포 서버에 둔다. 라이선스 원문을 보관하고 사용 제한을 이용약관에 반영한다 | [../THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md) |
| DB 마이그레이션 | 배포 때 `prisma migrate deploy`(`apps/api`). 지금까지 31개, 모두 열·표 추가라 기존 데이터에 영향 없음. 공식 캐릭터는 `prisma db seed`(이미 있어도 비밀 퀘스트를 맞춘다) | [plan/DATABASE.md](plan/DATABASE.md) |
| `apps/api/data/personas/*.json` 옮기기 | git에 없다(발행하면 공방이 만든다). 서버를 새로 만들면 다시 발행하거나 파일을 옮긴다 | [`apps/api/data/personas/README.md`](../apps/api/data/personas/README.md) |
| https | CSP `upgrade-insecure-requests`, 쿠키 `secure` | |
| 운영 콘솔(`console/`)을 바깥에 열지 않기 | 운영자 로그인만 있으면 신고 처리·내리기·등급 변경을 할 수 있다. 사내망·VPN·IP 허용 목록 뒤에 두고, 이용자 사이트와 다른 도메인으로 | `CONSOLE_BASE_URL`(웹), `API_BASE_URL`·`WEB_BASE_URL`(콘솔) |

이 항목들이 정해지기 전까지 `web_management/`의 배포 문서는 체크리스트 수준으로만 유지한다.

상세: [web_management/pre-deploy.md](web_management/pre-deploy.md), [web_management/docker-deploy.md](web_management/docker-deploy.md)
