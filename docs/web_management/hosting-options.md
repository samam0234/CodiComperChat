# 상시 서버 후보

2026-11-03 사용자 결정은 "상시 서버, Hetzner GEX45, 성인 모드 끔"이다. 계약은 아직 하지 않았다. 아래 값은 2026-11-03에 웹에서 읽은 것이니 계약 전에 다시 확인한다. 조건은 [docker-deploy.md](docker-deploy.md) "서버 조건".

| 후보 | 사양 | 값 | 위치 | 판단 |
|------|------|-----|------|------|
| [Hetzner GEX45](https://www.hetzner.com/dedicated-rootserver/matrix-gpu/) | RTX PRO 4000 Blackwell SFF 24GB, RAM 64GB, NVMe 512GB 2개 | 월 €214, 설치비 €209 (VAT 별도) | 헬싱키 | **조건을 모두 넘고 값이 확인된 후보.** [약관](https://www.hetzner.com/legal/terms-and-conditions/) 8.2항이 포르노·음란물 게시를 금지한다. 한국까지의 지연은 재지 않았다 |
| [Edgevana RTX 4070S](https://nodes.edgevana.com/gpu-servers/rtx-4070s/united-states) | 12GB. RAM·공인 IP 미확인 | 월 $171 | 미국 | 개발 PC와 같은 GPU로 가장 싸다. 나머지 조건을 확인해야 한다 |
| [Edgevana RTX 4090](https://nodes.edgevana.com/gpu-servers/rtx-4090/taiwan) | 24GB. RAM·공인 IP 미확인 | 월 $669 | 타이완 | 한국과 가깝지만 비싸다 |
| [iwinv](https://docs.iwinv.kr/blog/tags/gpu서버) 등 국내 업체 | 상품별 | 정가를 찾지 못함 | 국내 | 한국 이용자에게 가장 빠를 곳이다. 견적이 필요하다 |
| [RunPod Community](https://www.runpod.io/pricing) | 상품별 | 시간당 약 $0.34 (2차 자료, 730시간이면 약 $248) | 여러 곳 | **맞지 않는다.** 커뮤니티 서버는 중단될 수 있고 80·443을 직접 받을 수 있는지 확인하지 못했다 |

<!-- logic-structure -->
## 로직 구조

```text
성인 모드를 같이 공개? ──예──▶ 약관이 허용하는 업체만 (서면 확인)
        │ 아니오 (지금 결정)
        ▼
지연 · 데이터 위치 · 값 ─▶ Hetzner GEX45 권장 (24GB, RAM 64GB) ─▶ 계약은 사용자 몫
```

## 고르는 기준

1. **성인 모드를 함께 공개하는가.** 공개한다면 약관이 허용하는지 업체에 서면으로 확인한다. 위 표에서 약관을 읽은 곳은 Hetzner뿐이다. 국내 업체라도 국내법 문제는 그대로다 ([../../THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md)).
2. **지연.** 답 생성이 몇 초 걸리므로 왕복 지연은 작은 몫이지만 화면 이동마다 쌓인다. 체험 서버에서 재 본다.
3. **이용자 데이터 위치.** 국외 서버면 처리방침에 국가를 적는다.

## 권장

성인 모드를 끈 채 먼저 연다면 **Hetzner GEX45**를 권한다. 값이 확인됐고 그래픽 메모리가 개발 PC의 두 배라 대화 모델과 그림 모델이 번갈아 내려가는 일이 줄어들 것으로 본다(미측정). 운영 compose는 `ADULT_MODE=off`가 기본이라 그대로 올리면 성인 모드는 꺼져 있다.

서버를 만든 뒤: `sudo bash deploy/server-setup.sh`(실서버 실행 전, 문법 검사만 함) → [docker-deploy.md](docker-deploy.md) "처음 설치".

월드코퍼챗(2026-11-06) 뒤에도 GPU 서버 한 대 구성은 같다. 다만 진행자 답과 파트 판정이 같은 Ollama를 쓰므로 동시 사용자가 늘면 AI 대기열이 길어진다. DB 디스크는 그림 때문에 여유 있게 잡는다.
