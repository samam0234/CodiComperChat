# 서버 안 그림 엔진(diffusers) — WebUI 없이 services/ai에서 직접 그리기

| 항목 | 내용 |
|------|------|
| Subject | `feat(photonet): 서버 안 그림 엔진(diffusers) — WebUI 없이 services/ai에서 직접 그리기` |
| Full SHA | `f8039899231028c006d6d2fb4992810c9f8ca82d` |
| Short SHA | `f803989` |
| Branch | `feature/image-engine` |
| Parent | `ec96725` (develop) |
| Date | 2026-10-24T22:15:50+09:00 |

## 주 내용

- IMAGE_ENGINE=local(기본): services/ai 프로세스 안에서 diffusers로 체크포인트를 직접 읽어 그림 — 배포 때 WebUI가 필요 없음. IMAGE_ENGINE=webui면 기존 WebUI API
- WebUI 문법 인코더: (태그:가중치)는 토큰 임베딩에 곱하고 평균을 맞춤, BREAK·75토큰마다 따로 인코딩해 이어 붙임(SDXL 두 인코더·pooled 포함). Euler a
- 화풍별 모델 그대로: 애니메이션·웹툰 Animagine XL 4.0, 수채화·실사풍 SD 1.5. services/ai/models/(SD_MODEL_DIR)에 두고 git 제외
- requirements-image.txt(torch 2.10 cu128, diffusers 0.42, transformers 5.20.2, accelerate, safetensors)로 분리 — 기본 requirements.txt는 가벼움 유지

## 상세

**배경**
사용자 요청("원래 있던 webUI를 배포시 사용하기 곤란하면 services/ai에 서버 엔진용으로 하나 설치하고 애니메이션·웹툰·수채화·실사풍 모델 적용").

**변경 범위**
services/ai(image_local 신규, image_engine 분기, requirements-image.txt, README), .gitignore, docs/guidance(environment, photonet-engine)

**기술 포인트**
- 개발 PC venv에 설치 완료, CUDA 12.8 사용 가능 확인
- 모델 파일은 D:/SD의 체크포인트를 services/ai/models에 하드링크(같은 드라이브라 디스크를 더 안 씀)
- 실측: 애니메이션 두 사람 가로 한 장, 첫 모델 읽기 포함 약 188초, 두 사람이 구별되게 그려짐
- SD 1.5는 기본 안전 검사기를 끔 — 검수는 photonet_moderation이 한다

**안 한 것**
따뜻한 상태(모델 올라간 뒤)의 속도와 수채화·실사풍(SD 1.5) 경로는 실측하지 않음 — 사용자가 측정을 중단시킴. e2e는 가짜 엔진이라 이 경로를 타지 않음

## 결과

**동작 확인**
- AI import, 엔진 상태 확인(설치 전 준비 중 → 설치 뒤 준비됨)
- 실제 애니메이션 한 장 생성

**리스크**
uvicorn 프로세스가 torch를 올리면 RAM을 수 GB 더 쓴다(RAM 16GB에서 다른 서버와 함께)

**후속**
수채화 경로·속도 실측, develop 병합(사용자 확인 후)

**관련 문서**
docs/guidance/photonet-engine.md, environment.md, services/ai/README.md
