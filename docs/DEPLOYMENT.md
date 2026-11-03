# 배포 (짧은 진입)

> 상태(2026-11-03): **배포 구성은 만들어 개발 PC에서 끝까지 띄워 봤고, 실제 서버 배포는 아직이다.** 사용자 결정은 "GPU 서버에서 24시간"이다. 호스팅 업체 선택과 비용은 사용자 몫으로 남아 있다.

| 무엇을 하려는가 | 문서 |
|-----------------|------|
| 상시 서버 고르기 | [web_management/hosting-options.md](web_management/hosting-options.md) |
| 서버에 올리기 (절차·서버 조건·실측) | [web_management/docker-deploy.md](web_management/docker-deploy.md) |
| 올리기 전 체크 | [web_management/pre-deploy.md](web_management/pre-deploy.md) |
| 올린 뒤 확인 | [web_management/post-deploy.md](web_management/post-deploy.md) |
| 백업과 복구 | [web_management/backup-restore.md](web_management/backup-restore.md) |
| 구성도 | [Architecture/docker-topology.md](Architecture/docker-topology.md) |
| 환경변수 전체 | [guidance/environment.md](guidance/environment.md), [`deploy/.env.example`](../deploy/.env.example) |
| 보안·법률의 공개 전 필수 | [../SECURITY.md](../SECURITY.md), [../THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md) |
| 로컬 실행 | [guidance/getting-started.md](guidance/getting-started.md) |

## 결정된 것

| 항목 | 값 |
|------|-----|
| 구조 | NVIDIA GPU 서버 **한 대**에 전부 (`deploy/docker-compose.prod.yml`). 커지면 `ai`·`ollama`만 나눌 수 있다 |
| 운전 | 24시간. `restart: always`, 부팅 시 도커 자동 시작 |
| TLS | Caddy가 인증서 자동 발급·갱신, `X-Forwarded-*` 덮어쓰기 |
| 바깥에 열리는 것 | 80·443뿐 |
| 운영 콘솔 | 별도 도메인. Caddy와 앱(`CONSOLE_IP_ALLOWLIST`)에서 IP를 두 번 거른다 |
| 비밀값 | `deploy/.env`(git 제외). `node scripts/generate-prod-secrets.mjs`로 새로 만든다 |
| 백업 | 하루 한 번 `scripts/db-backup.sh`, 14일 보관 |
| 대화 모델 | 서버의 Ollama `gemma4:e4b`, `gemma4:12b` |
| 프리미엄 모델 | Claude·Grok 연동 코드 있음. `PREMIUM_PROVIDERS`와 API 키를 넣기 전까지 "준비 중"이다. 실제 호출은 키가 없어 미확인. 켜기 전에 [AI_MODEL_STRATEGY.md](plan/AI_MODEL_STRATEGY.md)의 지출·정책 항목을 본다 |
| 성인 모드 | 지금 방식 그대로(자기 신고, 2026-11-03 재확인) |
| 저장소 | GitHub 공개는 배포용, 라이선스로 clone·복제를 제한한다([../LICENSE](../LICENSE)) |

## 아직 사람이 해야 할 것

1. **호스팅 업체를 고르고 서버를 만든다.** 조건은 [docker-deploy.md](web_management/docker-deploy.md) "서버 조건"
2. 도메인을 사서 DNS를 서버로 돌린다
3. 운영 메일(SMTP) 서비스를 정한다. 없으면 API가 인증 메일을 보내지 못한다
4. 체크포인트 두 파일을 서버로 옮긴다
5. 약관·처리방침의 `[운영자 기재]` 칸과 라이선스 권리자 이름을 채우고, 법률 검토를 받는다
6. 성인 모드를 공개할지 변호사와 정한다. 국내법과 호스팅 약관이 걸린다 ([../THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md))
7. 토스 상점 계약(결제 재개할 때만)

## 구현하며 남긴 메모

| 무엇 | 왜 | 어디 |
|------|-----|------|
| 앞단 프록시가 `X-Forwarded-For`를 **덮어쓰게** | Nest는 사설망에서 온 이 헤더를 믿는다. 바깥 값을 넘기면 IP 기준 요청 한도를 속일 수 있다. Caddy는 기본으로 덮어쓴다 | `apps/api/src/main.ts` |
| `REQUIRE_HTTPS_EXEMPT_HOSTS=api` | 없으면 내부의 `http://api:4000`이 https로 돌아가 웹이 API를 못 부른다. 공개 도메인은 넣지 않는다 | `apps/api/src/security/https.ts` |
| 서버를 여러 대로 늘리면 `RATE_LIMIT_STORE=db` | 메모리 한도는 대수만큼 늘어난다. 한 대일 때는 필요 없다 | [guidance/environment.md](guidance/environment.md) |
| `AI_CONCURRENCY`를 대수로 나눠 정하기 | 대기열은 서버마다 따로다 | 〃 |
| 운영 스위치 | `NODE_ENV=production`, `APP_ENV=production`이면 개발용 스위치가 켜져 있을 때 시작하지 않는다 | `apps/api/src/security/production.ts`, `services/ai/app/internal_auth.py` |
| 그림 엔진 | 첫 실행 때 모델 구성 파일(수십 KB)을 Hugging Face에서 받아 볼륨에 캐시한다. GPU가 없으면 코디포토넷·웹툰은 "준비 중"으로 잠기고 나머지는 돈다 | [guidance/photonet-engine.md](guidance/photonet-engine.md) |
| DB 마이그레이션 | `migrate` 서비스가 기동 때 적용한다. 지금까지 33개 | [plan/DATABASE.md](plan/DATABASE.md) |
| `apps/api/data/personas/*.json` | git에 없다. 볼륨 `personas`에 둔다. 서버를 새로 만들면 다시 발행하거나 파일을 옮긴다 | [`apps/api/data/personas/README.md`](../apps/api/data/personas/README.md) |
| 웹의 `CONSOLE_BASE_URL` | 빌드할 때 리다이렉트에 박힌다. 도메인을 바꾸면 다시 빌드한다 | `deploy/node.Dockerfile` |
