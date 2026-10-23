# 코디포토넷 그림 엔진 (로컬 Stable Diffusion)

코디포토넷(대화 장면을 그림으로)은 이 PC에 설치된 **Stable Diffusion WebUI(AUTOMATIC1111)** 를 API 전용으로 띄워 쓴다. 2026-10-24 사용자 결정: 기존 `D:\SD\stable-diffusion-webui`를 쓰고, 애니메이션 모델은 Animagine XL 4.0을 받고, 수채화·실사풍은 있던 SD 1.5 기본 모델을 쓴다.

엔진이 꺼져 있으면 코디포토넷 창은 "준비 중"으로 잠기고 서버는 코레딧을 빼지 않고 503을 돌려준다. 나머지 기능(대화·오퍼레이션)은 엔진과 상관없이 돈다.

## 켜기

```bat
scripts\start-sd-webui.cmd
```

- WebUI가 다른 곳에 있으면 먼저 `set SD_WEBUI_DIR=설치 폴더`
- 처음 켜면 1~2분 걸린다(가상환경·torch 불러오기 + Animagine 읽기). 준비되면 로그에 `Uvicorn running on http://127.0.0.1:7860`
- 확인: `curl http://127.0.0.1:7860/sdapi/v1/options` 의 `sd_model_checkpoint`가 `animagine-xl-4.0-opt.safetensors [6327eca98b]`
- 끄기: 그 창에서 Ctrl+C

스크립트가 넘기는 옵션과 이유:

| 옵션 | 이유 |
|------|------|
| `--api --nowebui` | 화면 없이 API만. services/ai가 부른다 |
| `--server-name 127.0.0.1` | **꼭 필요.** 없으면 API 전용 모드가 `0.0.0.0`에 붙어 같은 네트워크의 다른 기기에서도 그림 생성 API를 부를 수 있다(직접 확인함) |
| `--port 7860` | services/ai의 기본값 `SD_WEBUI_URL`과 같다 |
| `--medvram-sdxl` | 그래픽카드 12GB를 Ollama와 나눠 쓴다. 다 그린 뒤 모델을 CPU 쪽으로 내려놓아 Ollama가 다시 쓸 수 있게 한다 |
| `--ckpt …animagine-xl-4.0-opt.safetensors` | 시작할 때 서비스에 쓰는 모델을 읽는다(안 주면 마지막에 쓰던 모델을 읽는다) |

- WebUI 폴더의 `webui-user.bat`은 건드리지 않는다
- 일부 셸(예: 에디터의 터미널)은 `NoDefaultCurrentDirectoryInExePath=1`을 켜 두어 cmd가 현재 폴더의 `webui.bat`을 못 찾는다. 스크립트가 자기 프로세스에서만 끈다
- 스크립트는 cmd가 바르게 읽도록 ASCII·CRLF로 둔다(`.gitattributes`의 `*.cmd eol=crlf`)

## 쓰는 모델 (이것만 쓴다)

WebUI 모델 폴더(`models\Stable-diffusion`)에 다른 체크포인트가 있어도 **서비스는 요청마다 아래 체크포인트를 못 박아 쓴다**. 그 폴더에는 성인용 모델도 있으니 다른 이름으로 바꾸지 않는다.

| 화풍 | 체크포인트 | 계열 | 라이선스 | 해상도(정사각·세로·가로) |
|------|-----------|------|----------|------------------------|
| 애니메이션 · 웹툰 | `animagine-xl-4.0-opt.safetensors` (cagliostrolab/animagine-xl-4.0, 6.94GB, SHA-256 `6327eca9…847ac` 확인) | SDXL | CreativeML Open RAIL++-M | 1024×1024 · 832×1216 · 1216×832 |
| 수채화 · 실사풍 | `v1-5-pruned-emaonly.safetensors` | SD 1.5 | CreativeML OpenRAIL-M | 512×512 · 512×768 · 768×512 |

- 설정: 28스텝, Euler a. CFG는 Animagine 5(모델 카드 권장 4~7), SD 1.5는 7
- Animagine은 모델 카드대로 품질 태그 `masterpiece, high score, great score, absurdres`와 등급 태그 `safe`를 붙인다
- 바꾸려면 `services/ai/.env`의 `SD_ANIME_MODEL`·`SD_BASE_MODEL` (그 모델이 WebUI 폴더에 없으면 엔진은 "준비 중"으로 보인다)

## 한 장이 만들어지는 길

1. 로컬 LLM(gemma4)이 한국어 장면 설명 + 캐릭터 설정(외모 등) + 최근 대화로 **영어 태그**를 쓴다. 답하자마자 Ollama에서 내린다(`keep_alive: 0`)
2. WebUI `txt2img` — 화풍에 맞는 체크포인트, 안전 부정 프롬프트(노출·성적·유혈·어린이 등) + 화질 부정 프롬프트
3. WebP로 줄인다(Pillow, 품질 88)
4. **그림 검수**: 공방 초상과 같은 검수(gemma4가 그림을 읽는다). 성적 노출·미성년자 성적 묘사·잔혹·혐오·자해가 보이면 돌려주지 않고(422) Nest가 코레딧을 돌려준다
5. Nest가 `photonet_images`에 저장하고, 그 대화를 하는 사람에게만 보인다(웹 중계 `/api/characters/:id/photonet/:imageId`)

안전 울타리는 세 겹이다: 태그에서 위험 단어 지우기 → 부정 프롬프트 → 그림 검수.

## 걸리는 시간 (RTX 4070 SUPER 12GB, RAM 16GB에서 측정)

| 경우 | 시간 |
|------|------|
| WebUI만, SDXL 1024×1024 8스텝 | 16초 (1.45 it/s) |
| 애니메이션 세로 한 장 (태그·그리기·검수 모두) | 약 45초 |
| 수채화 한 장, 애니메이션 다음이라 모델을 바꿀 때 | 약 63초 |
| WebUI 첫 시작 (모델 읽기 포함) | 1~3분 |

- 처음에 gemma4를 그래픽 메모리에 둔 채 SDXL을 돌렸더니 시스템 메모리로 밀려나 **한 스텝에 30~40초**(28스텝이면 15분)가 걸렸다. 그래서 1번 단계 뒤에 Ollama 모델을 내린다
- RAM 16GB에서는 SDXL과 SD 1.5를 함께 올려 둘 수 없어, 화풍 계열(애니·웹툰 ↔ 수채화·실사풍)을 바꾼 첫 장은 모델을 다시 읽는다. Nest는 그림 요청을 300초, services/ai는 WebUI를 290초 기다린다
- 그리는 동안 다른 사람이 대화하면 gemma4가 다시 올라와 느려질 수 있다(로컬 한 대의 한계)

## 시험

- e2e·CI는 엔진 없이 돈다: `LLM_FAKE=1`(또는 `IMAGE_FAKE=1`)이면 services/ai가 작은 그림을 직접 만들어 흐름(코레딧·저장·본인만 보기)만 시험한다
- 실제 엔진 확인은 WebUI를 켜고 대화 화면에서 코디포토넷으로 그려 본다
