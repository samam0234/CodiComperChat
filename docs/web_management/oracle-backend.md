# Oracle Cloud에 백엔드만 올리기

> 2026-11-07 사용자 결정: Oracle Cloud A1.Flex(ARM, GPU 없음, 도쿄)에 **API + DB만** 올린다. 웹·콘솔은 다른 곳에 둔다. 도메인은 아직 없어 `sslip.io` 이름을 쓴다.
> 전체 운영 구성(GPU 서버 한 대)은 [docker-deploy.md](docker-deploy.md)이고 그 결정은 바뀌지 않았다.

| 항목 | 값 |
|------|-----|
| 서버 | `168.110.61.178`, Ubuntu 24.04, 사용자 `ubuntu` |
| 구성 | [`deploy/oracle/docker-compose.yml`](../../deploy/oracle/docker-compose.yml): caddy → api, postgres, migrate |
| 바깥 주소 | `https://api.168-110-61-178.sslip.io` (Caddy가 인증서 자동 발급) |
| AI | 같은 VM에 올렸다(2026-11-07, `deploy/oracle/docker-compose.ai.yml`, `deploy/oracle/ai-deploy.sh`). 대화는 NVIDIA 호스팅 API(`google/gemma-4-31b-it`), 막히면 CPU Ollama(`gemma4:e4b`)가 대신 답한다. 그림은 GPU가 없어 잠겨 있다 |
| 메일 | `MAIL_SMTP_URL`이 비면 인증 메일을 못 보내고 로그만 남긴다 |

## 배포 상태 (2026-11-07)

| 무엇 | 상태 |
|------|------|
| 컨테이너 | caddy · api · postgres · ai · ollama 실행 중 (api·postgres·ai healthy), migrate는 기동 때 한 번 |
| 확인 | `/health` HTTPS 200, `/characters` 200, http는 https로 308. `ai-deploy.sh` 6단계 통과: api→ai 토큰 호출, NVIDIA 응답 19초, 예비 CPU 응답 32초 |
| 서버 | 2 OCPU · 12GB, 스왑 4GB(`ai-deploy.sh`가 만듦) |
| 비어 있는 값 | `MAIL_SMTP_URL`(인증 메일 안 감), `WEB_BASE_URL`(웹 미배포), `ANTHROPIC_API_KEY`·`XAI_API_KEY`·`PREMIUM_PROVIDERS`(프리미엄 "준비 중", `PREMIUM_MONTHLY_CREDITS=0`) |
| 안 올린 것 | 웹·콘솔, 그림 엔진, 공식 캐릭터 지식 파일(`apps/api/data/personas/*.json`, 볼륨 `personas`가 비어 있다) |
| 백업 | 아직 cron 없음 |

프리미엄을 열 때는 서버 `.env`에 키·`PREMIUM_PROVIDERS`·`PREMIUM_MONTHLY_CREDITS`(0 초과)를 적고 `api`·`ai`를 다시 띄운다. 키는 채팅·커밋에 붙이지 않는다.

## 로직 구조

```text
개발 PC ── git archive HEAD | ssh ──▶ ~/codicomperchat (서버)
                                          │ sudo bash deploy/oracle/server-setup.sh  (도커 · .env 비밀값)
                                          ▼
                     docker compose -f deploy/oracle/docker-compose.yml up -d --build
                                          ├─ migrate: prisma migrate deploy + seed
                                          ├─ postgres (내부망)
                                          └─ caddy :80 :443 ─▶ api :4000
```

## 처음 한 번 (사람)

1. Oracle 콘솔 → 인스턴스의 서브넷 → Security List에 Ingress `0.0.0.0/0` TCP **80**, **443**을 더한다. 80은 인증서 발급에 필요하다.
2. 접속 키: 인스턴스를 만들 때 받은 개인키가 없으면, 새 공개키를 서버의 `~/.ssh/authorized_keys`에 넣는다(콘솔 Cloud Shell·Run Command 등).

## 올리기 · 다시 올리기

```bash
git -c core.autocrlf=false -c core.eol=lf archive --format=tar HEAD | ssh codicomper-oci "mkdir -p ~/codicomperchat && tar -x -C ~/codicomperchat"
ssh codicomper-oci "sudo bash ~/codicomperchat/deploy/oracle/server-setup.sh"
ssh codicomper-oci "cd ~/codicomperchat && sudo docker compose --env-file deploy/oracle/.env -f deploy/oracle/docker-compose.yml up -d --build"
curl https://api.168-110-61-178.sslip.io/health
```

Windows(`core.autocrlf=true`)에서 그냥 `git archive`를 하면 파일이 CRLF로 나가 `.env` 값 끝에 `\r`이 붙는다. `core.autocrlf=false`만으로는 `text`로 정한 파일이 Windows 기본 `core.eol`(CRLF)로 나가서, `core.eol=lf`까지 준다(2026-11-07 실측: `.env.example`의 CR 21개 → 0개).

`deploy/oracle/.env`는 서버에서 처음 한 번 만들어지고 다시 덮어쓰지 않는다. 비밀값은 서버에만 있다.

## 프론트를 붙일 때

웹·콘솔의 `API_BASE_URL`을 `https://api.168-110-61-178.sslip.io`로 둔다. 브라우저가 아니라 Next 서버가 API를 부르므로 CORS 설정은 없다. 웹 주소가 정해지면 서버 `.env`의 `WEB_BASE_URL`을 채우고 api를 다시 띄운다.
