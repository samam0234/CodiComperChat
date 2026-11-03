# GPU 서버 한 대용 24시간 운영 구성을 넣다

| 항목 | 내용 |
|------|------|
| Subject | `feat(deploy): GPU 서버 한 대용 24시간 운영 구성을 넣다` |
| Full SHA | `d819584b487d356c2ba61d65bf287e1eed4a3b8b` |
| Short SHA | `d819584` |
| Branch | `feature/deploy-gpu` |
| Parent | `05a39e7` |
| Date | 2026-11-03 13:40:23 +0900 |

## 주 내용

- `deploy/`: 이미지 2종(node·ai), 운영 compose, Caddy(TLS), `.env.example`
- 바깥에 열리는 포트는 Caddy의 80·443뿐이고, 모든 상시 서비스가 `restart: always`다
- `scripts/db-backup.sh`: 덤프 확인 뒤 저장, 14일 보관
- `REQUIRE_HTTPS_EXEMPT_HOSTS`: 내부 호스트(`api`)의 http를 https로 돌려보내지 않게 했다
- 절차 문서 `docs/web_management/docker-deploy.md`, `backup-restore.md`

## 상세

**배경**
2026-11-03 사용자 결정: 배포 사이트의 GPU 서버에서 24시간 돌린다. 호스팅 업체는 정해지지 않아 어느 GPU 서버에서나 도는 구성으로 만들었다.

**변경 범위**
deploy/, .dockerignore, .gitignore, scripts/db-backup.sh, apps/api/src/security/https.ts, docs/web_management/

**기술 포인트**
- launch-safety의 HTTPS 강제가 내부 호출까지 막는 결함을 구성을 만들며 찾았다. `REQUIRE_HTTPS=1`이면 `http://api:4000`이 308로 돌아가 웹이 API를 부를 수 없었다
- web과 console은 Caddy와 내부망 양쪽에, 나머지는 내부망에만 둔다
- Caddy가 `X-Forwarded-For`와 `X-Forwarded-Proto`를 덮어써 앱의 판단이 믿을 수 있다
- Ollama 이미지는 개발 PC와 같은 0.40.13으로 고정했다. 처음 고른 0.12.6은 gemma4에 너무 낮은 버전이었다

**안 한 것**
서버 만들기와 실제 배포(비용, 업체 선택은 사용자 몫), 백업의 외부 저장소 복사.

## 결과

**동작 확인**
개발 PC에서 운영 compose를 실제로 띄웠다. 빌드, 기동 순서, http→https 308, HSTS, 콘솔 IP 차단 403, FastAPI 토큰 없이 401, 가입→프로필→대화(실제 gemma4) 200, 컨테이너 안 초상 200, 재시작 횟수 0→1, 백업→새 DB 복구(캐릭터 2·계정 1·마이그레이션 33) 모두 확인. `https.spec.ts` 8개 통과.

**리스크**
Let's Encrypt 실제 발급, 실제 SMTP, 서버 재부팅 복귀, 장시간 운전, 부하, 컨테이너 안 SDXL 그림은 시험하지 못했다.

**후속**
호스팅 업체 선택 후 실제 배포.

**관련 문서**
[docker-deploy.md](../../web_management/docker-deploy.md), [backup-restore.md](../../web_management/backup-restore.md)
