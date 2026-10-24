# 제3자 구성요소 고지

코디컴퍼챗 자체 코드는 [LICENSE](LICENSE)(독점)를 따른다. 이 문서는 **그 밖의 것** — 의존하는 오픈소스 소프트웨어, 쓰는 AI 모델, 함께 쓰는 도구 — 의 라이선스를 정리한다. 이들은 각자의 조건을 따른다.

- 기준 시점: 2026-10-24. 아래 소프트웨어 버전과 라이선스 표기는 이 저장소에 설치된 패키지의 메타데이터에서 읽은 값이다.
- 전체 목록(의존하는 의존성까지)은 이 문서에 다 적지 않았다. 배포 전에 도구로 전체를 뽑아 검토한다: Node `npx license-checker --production --summary`, Python `pip-licenses`(설치 필요).
- **모델 가중치는 저장소에 없다.** 개발 PC에서 각자 받아 `services/ai/models/`(git 제외)에 둔다.

## 1. 쓰는 AI 모델 — 배포 전에 반드시 원문을 확인할 것

모델은 일반 소프트웨어 라이선스보다 **사용 제한**이 붙는 일이 많다. 이 서비스는 성인 모드(성적 장면·폭력 묘사 그림)가 있어서 특히 중요하다.

| 모델 | 용도 | 라이선스(알고 있는 범위) | 확인할 것 |
|------|------|--------------------------|-----------|
| Gemma (`gemma4:e4b`, Ollama로 실행) | 캐릭터 대화·요약·판정·그림 장면 설계·그림 검수 | Google Gemma 이용약관 + 사용 금지 정책 | **사용 금지 정책의 성적 콘텐츠 조항.** 성인 모드가 이 모델로 성적 장면의 설계와 검수를 하므로, 정책이 이를 허용하는지 원문으로 확인해야 한다. 허용하지 않으면 성인 모드의 LLM을 다른 모델로 바꾸거나 기능을 접어야 한다. 확인 전에는 성인 모드를 공개하지 않는다 |
| Animagine XL 4.0 Opt | 애니메이션·웹툰 그림 | CreativeML Open RAIL++-M (모델 카드 기준) | RAIL 라이선스의 **사용 제한 목록**(미성년자 착취, 불법, 허위정보, 괴롭힘 등)과 파생물 고지 의무. 모델 카드에서 최신 조건 재확인 |
| Stable Diffusion 1.5 (`v1-5-pruned-emaonly`) | 수채화·실사풍 그림 | CreativeML OpenRAIL-M | 위와 같은 사용 제한. 원 배포처가 바뀌었을 수 있어 받은 곳의 라이선스 원문 보관 |

- RAIL 계열 라이선스의 사용 제한은 **서비스 이용자에게도 전달**해야 하는 경우가 있다. 이용약관에 사용 제한을 반영했는지 법률 검토 때 함께 본다.
- 서비스는 이 모델들이 만든 그림에 자체 검수(`photonet_moderation`)를 거는데, 모델 라이선스의 의무를 대신하지 않는다.
- WebUI 폴더에는 성인용 모델이 더 있지만 **서비스가 선택하지 않는다**(화풍마다 체크포인트를 코드에서 못 박음). 그 파일을 `services/ai/models/`에 넣지 않는다.

## 2. 함께 쓰는 도구 (배포물에 포함되지 않음)

| 도구 | 라이선스 | 쓰임 |
|------|----------|------|
| Ollama | MIT | 로컬 LLM 실행 |
| PostgreSQL 16 | PostgreSQL License | 데이터베이스 |
| Mailpit | MIT | 개발용 메일 서버(docker compose) |
| Stable Diffusion WebUI (AUTOMATIC1111) | **AGPL-3.0** | 개발 PC의 선택적 그림 엔진(`IMAGE_ENGINE=webui`). **배포물에 넣거나 서비스로 공개하지 않는다** — 기본 엔진(`local`, diffusers)은 WebUI 코드를 쓰지 않는다 |
| Docker | 제품 약관 | 선택(개발 DB·메일) |

## 3. 웹·API (Node)

| 패키지 | 버전 | 라이선스 |
|--------|------|----------|
| next | 16.3.5 | MIT |
| react, react-dom | 19.2.8 | MIT |
| @nestjs/core, common, platform-express | 12.0.3 | MIT |
| express | 5.2.1 | MIT |
| @prisma/client, prisma, @prisma/adapter-pg | 7.10.0 | Apache-2.0 |
| pg | 8.23.0 | MIT |
| jose | 6.2.12 | MIT |
| nodemailer | 7.0.13 | MIT-0 |
| rxjs | 7.8.2 | Apache-2.0 |
| dotenv | 17.4.2 | BSD-2-Clause |
| typescript (개발) | 5.9.3 | Apache-2.0 |
| vitest (개발) | 4.1.11 | MIT |
| oxlint (개발) | 1.83.0 | MIT |
| @playwright/test (개발) | 1.64.1 | Apache-2.0 |

외부 CDN 글꼴·CSS 프레임워크는 쓰지 않는다(시스템 글꼴 스택, CSS Modules). 결제 SDK는 토스페이먼츠 스크립트(`js.tosspayments.com`)를 요금 화면에서만 받는다 — 토스페이먼츠 약관을 따른다(결제는 현재 보류).

## 4. AI 서비스 (Python)

| 패키지 | 버전 | 라이선스 | 비고 |
|--------|------|----------|------|
| fastapi | 0.141.1 | MIT | |
| starlette | 1.6.0 | BSD-3-Clause | fastapi 의존 |
| pydantic | 2.13.5 | MIT | |
| uvicorn | 0.53.0 | BSD-3-Clause | |
| httpx | 0.28.1 | BSD-3-Clause | |
| pillow | 13.0.0 | MIT-CMU | 그림을 WebP로 줄이기 |
| torch | 2.10.0+cu128 | BSD-3-Clause | 그림 엔진(`requirements-image.txt`) |
| diffusers | 0.42.0 | Apache-2.0 | 〃 |
| transformers | 5.20.2 | Apache-2.0 | 〃 |
| accelerate | 1.15.0 | Apache-2.0 | 〃 |
| safetensors | 0.8.0 | Apache-2.0 | 〃 |
| huggingface_hub | 2.3.0 | Apache-2.0 | 〃 (모델 구성 파일을 받을 때) |
| numpy | 2.5.4 | BSD-3-Clause 외(복합) | 〃 |

그림 엔진 의존성(torch 등)은 NVIDIA CUDA 런타임 라이브러리를 함께 받는다 — NVIDIA의 배포 조건이 따로 있다. 배포 이미지를 만들 때 확인한다.

## 5. 이 저장소가 지키는 것

- 서드파티 라이선스 파일을 지우지 않는다(`node_modules`·`.venv`는 git에 올리지 않고, 배포물을 만들 때 각 패키지의 LICENSE가 함께 들어가게 한다).
- 의존성을 추가·교체하면 이 문서의 표를 같이 고친다(체크리스트: [docs/plan/CURRENT_STACK.md](docs/plan/CURRENT_STACK.md) "문서 갱신 체크리스트").
- 이 문서는 법률 자문이 아니다. 공개 출시 전 법률 검토 항목에 포함한다([SECURITY.md](SECURITY.md) "공개 전 필수").
