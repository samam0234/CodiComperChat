# 로컬 Stable Diffusion으로 코디포토넷 그림 만들기

| 항목 | 내용 |
|------|------|
| Subject | `feat(photonet): 로컬 Stable Diffusion으로 코디포토넷 그림 만들기` |
| Full SHA | `d177b896d676132c24628bf107b1da4aadd7609d` |
| Short SHA | `d177b89` |
| Branch | `feature/photonet-sd` |
| Parent | `860ea03` (feature/photonet-sd) |
| Date | 2026-10-24T04:38:11+09:00 |

## 주 내용

- 코디포토넷이 실제로 그림을 만든다: 로컬 Stable Diffusion WebUI(AUTOMATIC1111, 기존 D:/SD 설치)를 API로 연결
- 애니메이션·웹툰 모델 Animagine XL 4.0 Opt를 받아 넣음(6.94GB, SHA-256 확인), 수채화·실사풍은 있던 SD 1.5 기본 모델
- 흐름: 장면·캐릭터 외모 → 영어 태그(로컬 LLM) → WebUI txt2img → WebP → 그림 검수(gemma4) → 저장, 50 코레딧(실패·검수 걸림은 환불)
- 그림 저장 photonet_images, 그 대화를 하는 사람만 보는 그림 API와 웹 중계, 창에 그리는 중 표시·갤러리
- 엔진 실행 스크립트 scripts/start-sd-webui.cmd(127.0.0.1 전용, API만)
- 커뮤니티: 새 글을 미래 시각으로 찍어 내 글보다 위에 오던 버그 수정

## 상세

**배경**
사용자 요청("코디포토넷으로 이미지를 만들 수 있도록 하자 … Stable Diffusion을 넣고 … 애니메이션 관련 모델을 넣고")에 따라 만들었다. 질문으로 정한 것: 기존 D:/SD WebUI 사용, Animagine XL 4.0 받기, 수채화·실사풍은 SD 1.5, 직접 띄워 실제 생성까지 확인.

**변경 범위**
services/ai(image_engine·photonet·routes·schemas·llm keep_alive·fake_llm·requirements pillow), apps/api(operations·ai-client·rate-limit·prisma), apps/web(photonet 창·중계 라우트·lib·actions), scripts/start-sd-webui.cmd, e2e/tests/operations.spec.ts, docs(photonet-engine.md 신규 외)

**기술 포인트**
- 서비스는 요청마다 체크포인트를 못 박는다 — WebUI 폴더에 성인용 모델이 있어도 쓰지 않는다
- 안전 울타리 세 겹: 태그의 위험 단어 제거, 안전 부정 프롬프트, 기존 그림 검수(성적·미성년자·잔혹·혐오·자해면 422+환불)
- WebUI API 전용 모드는 --server-name 없이 0.0.0.0에 붙는 것을 직접 확인 → 스크립트에 --server-name 127.0.0.1
- gemma4를 그래픽 메모리에 둔 채 SDXL을 돌리면 시스템 메모리로 밀려 한 스텝 30~40초 → 태그를 만든 직후 Ollama keep_alive:0으로 내려 한 장 약 45초로
- RAM 16GB라 SDXL·SD1.5를 함께 못 올려 화풍 계열 전환 첫 장은 다시 읽음(수채화 약 63초) → 그림 요청만 Nest 300초·services/ai 290초 대기
- cmd 스크립트: UTF-8·LF는 cmd가 줄을 잘못 읽어 ASCII·CRLF로, 일부 셸의 NoDefaultCurrentDirectoryInExePath를 스크립트 안에서만 끔
- e2e·CI는 LLM_FAKE/IMAGE_FAKE로 엔진 없이 작은 그림을 만들어 흐름만 시험
- 커뮤니티 새 글 시각을 now+(3-i)*10 → now-i*10 (e2e에서 순서가 뒤집힌 것을 발견)

**안 한 것**
화풍 계열 전환 대기를 줄이는 것(RAM 증설 또는 화풍을 한 모델로 통일), 그림 지우기, 대화 말풍선에 그림 붙이기

## 결과

**동작 확인**
- 실제 엔진: 애니메이션 세로 832×1216 44.9초·수채화 512×512 63.2초를 만들어 눈으로 확인(장면·외모 반영), 검수 통과
- WebUI가 127.0.0.1:7860에서만 받는 것과 Animagine 로드를 확인
- 타입 검사 api·web·console, oxlint, API 단위 테스트 172개, AI 서비스 컴파일
- 전체 e2e 87개 통과(코디포토넷 3개: 50 코레딧·크기·WebP·남은 404·부족 403·화면 흐름), 하이드레이션 경고 0
- 개발 DB에 마이그레이션 20261024100000_photonet_images 적용

**리스크**
그리는 동안 대화가 몰리면 gemma4가 다시 올라와 느려질 수 있다(로컬 한 대의 한계). 엔진을 켤 때는 반드시 스크립트로(직접 켜면 0.0.0.0에 붙을 수 있다)

**후속**
develop 병합

**관련 문서**
docs/guidance/photonet-engine.md(신규), OPERATIONS.md, API_DOCUMENTATION, DATABASE, AI_MODEL_STRATEGY, environment, getting-started
