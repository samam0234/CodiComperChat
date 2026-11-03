# 운영 배포 절차 (GPU 서버 한 대, 24시간)

2026-11-03 사용자 결정: **배포 사이트의 GPU 서버에서 24시간 돌린다.** 구성 파일은 [`deploy/`](../../deploy/)에 있다. 호스팅 업체는 아직 고르지 않았고 서버도 만들지 않았다. 비용이 드는 일이라 사용자가 고른다. 후보: [hosting-options.md](hosting-options.md).

```text
인터넷 ─ 80·443 ─ caddy ─┬─ web (Next, 이용자)  ─┐
                         └─ console (Next, IP 제한) ┤
                                                    └─ api (Nest) ─┬─ postgres
                                                                   └─ ai (FastAPI + 그림 엔진, GPU) ─ ollama (GPU)
```

바깥에 열리는 포트는 caddy의 80·443뿐이다. 나머지는 내부망에만 있다.

## 서버 조건

| 항목 | 기준 | 근거 |
|------|------|------|
| GPU | NVIDIA, 그래픽 메모리 12GB 이상 | RTX 4070 SUPER 12GB에서 실측. 8GB 이하는 `SD_OFFLOAD=1`(느려짐, 미측정) |
| 시스템 RAM | **32GB 권장** | 16GB PC에서 다른 작업과 겹치자 SDXL을 올린 뒤 gemma를 올리지 못해 실패했다(2026-11-03) |
| 디스크 | 100GB 이상 | 이미지 약 19GB(ai 12.2GB, node 3개 각 약 2.4GB) + 체크포인트 약 10GB + gemma4 2종 약 17GB + DB·백업 |
| 실행 환경 | Docker + NVIDIA 컨테이너 런타임 | `docker run --gpus all`이 돼야 한다 |
| 네트워크 | 공인 IP로 80·443을 직접 받을 수 있을 것 | Caddy가 인증서를 받는다 |
| 과금 | 멈추지 않는 상시 서버(월정액 또는 온디맨드) | 스팟·중단형은 24시간 조건에 맞지 않는다 |

## 배포 키

저장소가 비공개라 서버가 받으려면 키가 필요하다. 비밀 키는 서버에만 두고 저장소에 커밋하지 않는다.

```bash
ssh-keygen -t ed25519 -f ~/.ssh/codicomperchat_deploy -N "" -C "codicomperchat-server"
cat ~/.ssh/codicomperchat_deploy.pub    # GitHub 저장소 Settings → Deploy keys에 등록. 쓰기 권한은 주지 않는다
git config --global core.sshCommand "ssh -i ~/.ssh/codicomperchat_deploy -o IdentitiesOnly=yes"
```

## 처음 설치

```bash
# 저장소가 비공개이므로 먼저 서버에 읽기 전용 배포 키를 등록한다 (아래 "배포 키")
git clone git@github.com:samam0234/CodiComperChat.git /srv/codicomperchat && cd /srv/codicomperchat
sudo bash deploy/server-setup.sh            # Ubuntu: 도커·NVIDIA·방화벽. 실서버에서 돌려 본 적 없음
node scripts/generate-prod-secrets.mjs      # 출력은 터미널에만 둔다
cp deploy/.env.example deploy/.env          # 값 채우기. 도메인 DNS를 이 서버로 먼저 돌린다
mkdir -p /srv/codicomperchat/models         # 체크포인트 두 파일을 여기에 둔다 (guidance/photonet-engine.md)

docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml up -d --build

# 처음 한 번: 대화 모델 받기
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml exec ollama ollama pull gemma4:e4b
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml exec ollama ollama pull gemma4:12b

# 운영자 만들기: 가입한 뒤
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml exec api npm run user:role -- 이메일 admin
```

`migrate`가 한 번 돌며 마이그레이션과 공식 캐릭터 시드를 적용한 뒤 끝난다(`Exited (0)`이 정상). 그다음 api가 뜬다.

## 24시간 유지

- 모든 상시 서비스가 `restart: always`다. 프로세스가 죽으면 도커가 다시 띄운다. 서버가 재부팅되면 도커 서비스가 켜지면서 함께 뜬다 (`systemctl enable docker`)
- 대화 모델은 30분 동안 그래픽 메모리에 남는다(`OLLAMA_KEEP_ALIVE`). 그림을 그릴 때는 필요한 만큼 먼저 내린다
- 그림 모델은 처음 그릴 때 읽는다. 재시작 뒤 첫 그림은 오래 걸린다(아래 실측)
- 로그는 서비스마다 20MB씩 5개까지만 남긴다
- 백업: [backup-restore.md](backup-restore.md)의 cron을 건다

업데이트:

```bash
git pull
docker compose --env-file deploy/.env -f deploy/docker-compose.prod.yml up -d --build
```

DB가 바뀌는 업데이트 전에는 백업을 먼저 받는다. 되돌리려면 이전 커밋을 체크아웃해 같은 명령을 돌린다. 마이그레이션을 이미 적용했다면 코드만 되돌려도 되는지 그 마이그레이션을 보고 판단하고, 필요하면 백업에서 복구한다.

## 내부 호스트와 HTTPS

운영 API는 공개 호스트의 http를 https로 돌려보낸다. 내부망의 웹·콘솔은 `http://api:4000`으로 부르므로, compose가 `REQUIRE_HTTPS_EXEMPT_HOSTS=api`를 넣는다. **이 값에 공개 도메인을 넣지 않는다.**

## 확인 (2026-11-03, 개발 PC의 Docker Desktop + RTX 4070 SUPER에서 실제로 띄움)

| 항목 | 결과 |
|------|------|
| 이미지 빌드 4개 | 성공 |
| 기동 순서 (postgres → migrate → api → web·console → caddy) | 성공, 모두 healthy |
| 바깥 포트 | caddy뿐 (`docker compose ps`로 확인) |
| http → https | 308 |
| https 응답 | HSTS·CSP·`X-Frame-Options` 있음. 홈에 시드한 캐릭터가 보임 → 웹→API 내부 호출 동작 |
| 콘솔, 허용 목록 밖 IP | 403 |
| FastAPI, 토큰 없이 | 401 |
| 공개 캐릭터 응답에 퀘스트 달성 조건 | 없음 |
| 가입 → 프로필 → 대화 한 턴 (실제 gemma4) | 200, 약 3.4초 |
| 컨테이너 안 AI 초상(수채화, 모델 읽기 포함) | 200, 약 68초 |
| 컨테이너 안 GPU | `torch.cuda.is_available()` True |
| 프로세스 종료 뒤 자동 재시작 | `RestartCount` 0 → 1, 다시 동작 |
| 고정한 Ollama 이미지(0.40.13)에서 gemma4:e4b | 호출하면 100% GPU로 올라감(`ollama ps`). 답 문장은 터미널 제어 문자에 가려 직접 읽지 못했다 |
| 백업·복구 | [backup-restore.md](backup-restore.md) |

**시험하지 못한 것**: 진짜 도메인의 Let's Encrypt 인증서 발급(시험은 Caddy 내부 인증서), 실제 SMTP 메일, 서버 재부팅 뒤 복귀, 며칠 이상의 연속 운전, 동시 접속 부하. 시험에서 대화는 컨테이너 Ollama 대신 개발 PC의 Ollama로 보냈다(디스크에 모델을 또 받지 않으려고). 컨테이너 Ollama는 위처럼 모델을 올리는 데까지만 따로 확인했다. SDXL 그림을 컨테이너 안에서 끝까지 그려 보지는 않았다. Docker Desktop의 메모리가 7.6GB로 잡혀 있어 SD1.5만 그렸다.

## 그림 속도 (실측 2026-11-03, 12GB, RAM 16GB)

| 경로 | 처음(모델 읽기 포함) | 모델이 올라간 뒤 |
|------|---------------------|------------------|
| SD 1.5 초상 (수채화·실사풍, 저장 384px) | 약 90~103초 | **약 5~8초** |
| SDXL 초상 (애니메이션·웹툰 화풍) | 약 137초 | 약 57~93초 |
| 웹툰 콘티 3컷 (LLM) | — | 약 11초 |
| 웹툰 컷 1장 (1216×832, 검수 포함) | — | 약 54~83초 |

SDXL이 느린 것은 그림 뒤 검수용 gemma와 그래픽 메모리를 나눠 쓰느라 내리고 올리기를 반복하는 탓으로 보인다(원인은 재지 않았다). 그래픽 메모리가 더 큰 서버면 빨라질 수 있다. 관련 표: [../guidance/photonet-engine.md](../guidance/photonet-engine.md).
