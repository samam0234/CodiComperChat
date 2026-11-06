# Oracle Cloud에 백엔드만 올리기

> 2026-11-07 사용자 결정: Oracle Cloud A1.Flex(ARM, GPU 없음, 도쿄)에 **API + DB만** 올린다. 웹·콘솔은 다른 곳에 둔다. 도메인은 아직 없어 `sslip.io` 이름을 쓴다.
> 전체 운영 구성(GPU 서버 한 대)은 [docker-deploy.md](docker-deploy.md)이고 그 결정은 바뀌지 않았다.

| 항목 | 값 |
|------|-----|
| 서버 | `168.110.61.178`, Ubuntu 24.04, 사용자 `ubuntu` |
| 구성 | [`deploy/oracle/docker-compose.yml`](../../deploy/oracle/docker-compose.yml): caddy → api, postgres, migrate |
| 바깥 주소 | `https://api.168-110-61-178.sslip.io` (Caddy가 인증서 자동 발급) |
| 안 올린 것 | AI(FastAPI·Ollama). 대화·그림 요청은 실패하고 나머지는 돈다. 같은 VM에 CPU AI를 더하는 절차: [ai-server-guide.html](ai-server-guide.html) (`deploy/oracle/docker-compose.ai.yml`) |
| 메일 | `MAIL_SMTP_URL`이 비면 인증 메일을 못 보내고 로그만 남긴다 |

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
