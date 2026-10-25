# Docker 토폴로지 (목표)

> 상태(2026-10-24): `docker-compose.yml`에는 **`postgres`와 `mailpit`(개발 메일)** 만 있다(로컬 개발은 설치형 PostgreSQL을 쓰고 compose는 선택 — 로컬 개발은 설치형 PostgreSQL을 쓴다 · [../guidance/docker-run.md](../guidance/docker-run.md)). web·api·ai 컨테이너는 배포 단계에서 만든다. 아래는 계획서 §7.3 근거의 목표 토폴로지다. Redis는 지금 쓰지 않는다(요청 한도·대기열을 메모리/PostgreSQL로 해결).

## 목표 서비스 구성

```text
compose
├── web        # Next.js (apps/web)
├── console    # Next.js 운영 콘솔 (console/) — 바깥에 열지 않는다
├── api        # Nest.js (apps/api)
├── ai         # FastAPI (services/ai) — GPU, 그림 엔진 포함
└── postgres
```

Redis는 쓰지 않는다. 배포 시 `web`+`api`와 `ai`는 분리 스케일이 가능하게 둔다 — `ai`가 GPU(그림 엔진)/호스티드 LLM 비용 때문에 먼저 스케일 대상이 될 가능성이 높다 (계획서 §7.3). `ai` 컨테이너는 NVIDIA 컨테이너 런타임·GPU 접근, `requirements-image.txt` 설치, 모델 가중치 볼륨(`services/ai/models/`)이 필요하다([../guidance/photonet-engine.md](../guidance/photonet-engine.md)).

## 아직 정하지 않은 것

- Compose 프로젝트명
- 포트 매핑 (제안값은 `plan/CURRENT_STACK.md` 참고, 미확정)
- 볼륨 전략 (Postgres 데이터, 초상 이미지 등 에셋, 그림 모델 가중치 — 수 GB)
- GPU 서버 구성: Ollama와 그림 엔진이 그래픽 메모리를 나눠 쓴다(같은 서버면 12GB급, 따로면 각각)

관련: [../plan/CURRENT_STACK.md](../plan/CURRENT_STACK.md), [../web_management/ports-inventory.md](../web_management/ports-inventory.md)
