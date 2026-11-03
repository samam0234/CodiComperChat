# 제3자 구성요소 고지

코디컴퍼챗 자체 코드는 [LICENSE](LICENSE)(독점)를 따른다. 이 문서는 **그 밖의 것** — 의존하는 오픈소스 소프트웨어, 쓰는 AI 모델, 함께 쓰는 도구 — 의 라이선스를 정리한다. 이들은 각자의 조건을 따른다.

- 기준 시점: 2026-11-03(운영 이미지 추가, Next.js 16.4.4·Nodemailer 10.3). 아래 소프트웨어 버전과 라이선스 표기는 이 저장소에 설치된 패키지의 메타데이터에서 읽은 값이다.
- 전체 목록(의존하는 의존성까지)은 이 문서에 다 적지 않았다. 배포 전에 도구로 전체를 뽑아 검토한다: Node `npx license-checker --production --summary`, Python `pip-licenses`(설치 필요).
- **모델 가중치는 저장소에 없다.** 개발 PC에서 각자 받아 `services/ai/models/`(git 제외)에 둔다.

## 1. 쓰는 AI 모델 — 배포 전에 반드시 원문을 확인할 것

모델은 일반 소프트웨어 라이선스보다 **사용 제한**이 붙는 일이 많다. 이 서비스는 성인 모드(성적 장면·폭력 묘사 그림)가 있어서 특히 중요하다.

| 모델 | 용도 | 라이선스(알고 있는 범위) | 확인할 것 |
|------|------|--------------------------|-----------|
| Gemma 4 (`gemma4:e4b`, `gemma4:12b`, Ollama로 실행) | 캐릭터 대화·요약·판정·그림 장면 설계·그림 검수 | **Apache License 2.0** | **2026-11-03 정정.** 2026-10-25에는 Gemma 이용약관의 [사용 금지 정책](https://ai.google.dev/gemma/prohibited_use_policy) 4항(성적 표현 생성 금지)이 적용된다고 적었는데 **틀렸다.** [Gemma 이용약관](https://ai.google.dev/gemma/terms)(2026-04-01 수정)은 부록의 Gemma 1~3n에만 적용되고 Gemma 4는 [별도 라이선스](https://ai.google.dev/gemma/docs/gemma_4_license)를 따른다고 적혀 있으며, 그 문서는 Apache 2.0 전문이다. `ollama show gemma4:e4b --license`도 Apache 2.0이고, [Google 발표](https://blog.google/innovation-and-ai/technology/developers-tools/gemma-4/)와 [모델 카드](https://huggingface.co/google/gemma-4-e4b-it)도 같다. 라이선스 사본과 고지를 함께 보관한다. Gemma 3 이하로 내리면 금지 정책이 다시 적용된다. 이 문단은 라이선스 확인이고 법률 자문이 아니며, 성인 모드의 국내법 문제와는 별개다(아래) |
| Claude (Anthropic API) · Grok (xAI API) | 프리미엄 모델을 고른 대화의 답 | 각 공급자의 이용약관·사용 정책 | [Anthropic 사용 정책](https://www.anthropic.com/legal/aup)은 성적 콘텐츠 생성을 금지한다. 성인 모드 설계는 이쪽으로 보내지 않는다([AI_MODEL_STRATEGY.md](docs/plan/AI_MODEL_STRATEGY.md)). xAI 정책 원문은 접근이 막혀 읽지 못했으니 키를 넣기 전에 사람이 읽는다 |
| Animagine XL 4.0 Opt | 애니메이션·웹툰 그림 | CreativeML Open RAIL++-M (모델 카드 기준) | RAIL 라이선스의 **사용 제한 목록**(미성년자 착취, 불법, 허위정보, 괴롭힘 등)과 파생물 고지 의무. 모델 카드에서 최신 조건 재확인 |
| Stable Diffusion 1.5 (`v1-5-pruned-emaonly`) | 수채화·실사풍 그림 | CreativeML OpenRAIL-M | 위와 같은 사용 제한. 원 배포처가 바뀌었을 수 있어 받은 곳의 라이선스 원문 보관 |

- **성인 모드에서 남은 위험은 모델 라이선스가 아니라 국내법과 호스팅 약관이다.** [청소년 보호법 제16조](https://www.law.go.kr/detcInfoP.do?detcSeq=44927&mode=0)는 청소년유해매체물을 제공하는 자에게 상대방의 나이와 본인 여부 확인을 요구하는데, 지금 방식은 자기 신고다. 음란물 유통 규정(정보통신망법 제44조의7)과 AI 생성물에 대한 적용은 원문·판례를 확인하지 못했다. 호스팅 약관도 본다. 예: [Hetzner 약관](https://www.hetzner.com/legal/terms-and-conditions/) 8.2항은 포르노·음란물 게시를 금지한다. **변호사 확인 전에는 성인 모드를 공개하지 않는다.**
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

## 2-1. 운영 컨테이너 이미지

운영 구성(`deploy/`)이 받아 쓰는 이미지다. 저장소에 포함되지 않는다. 라이선스는 일반적으로 알려진 값이며 배포 전 원문을 확인한다: Caddy(Apache-2.0), PostgreSQL(PostgreSQL License), Ollama(MIT), Node.js·Python 공식 이미지(각 구성요소의 라이선스).

## 3. 웹·API (Node)

| 패키지 | 버전 | 라이선스 |
|--------|------|----------|
| next | 16.4.4 | MIT |
| react, react-dom | 19.2.8 | MIT |
| @nestjs/core, common, platform-express | 12.0.3 | MIT |
| express | 5.2.1 | MIT |
| @prisma/client, @prisma/adapter-pg 7.10.0, prisma 7.10.1 | 7.10 | Apache-2.0 |
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
