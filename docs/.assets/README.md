# docs/.assets — README와 문서의 그림·영상

문서(`.md`)와 섞이지 않게 그림·영상만 둔다. 2026-11-06에 `docs/assets/`에서 이름을 바꿨다(사용자 요청: "assets 폴더명도 별개로 취급되니 .assets로").

**전부 다시 만들 수 있다.** 손으로 그린 것은 없고, 실제로 띄운 앱을 찍거나(`capture.mjs`·`tour.mjs`·`world.mjs`) HTML로 그렸다(`art.mjs`). 만드는 법은 [../../scripts/readme-media/README.md](../../scripts/readme-media/README.md).

<!-- logic-structure -->
## 로직 구조

```text
scripts/readme-media/*.mjs ─▶ docs/.assets/readme/*.png|jpg|gif|mp4
                                   │
            ┌──────────────────────┼─────────────────────────┐
            ▼                      ▼                         ▼
     루트 README.md          docs/*.md (구조 그림)     앱별 README (링크)
(손으로 그린 그림은 두지 않는다 — 전부 다시 만들 수 있다)
```

## 폴더

```text
docs/.assets/
├── README.md        이 파일
└── readme/          루트 README와 docs 문서가 쓰는 그림·영상
```

## 그림 목록 (`readme/`)

### HTML로 그린 것 (`node scripts/readme-media/art.mjs`, 서버 필요 없음)

| 파일 | 내용 | 쓰는 곳 |
|------|------|---------|
| `banner.png` | 맨 위 배너 | README |
| `stack.png` | 기술 스택(버전은 package.json·requirements 고정값) | README 구조 |
| `architecture.png` | 시스템 구조(웹·콘솔 → Nest → PostgreSQL·FastAPI → Ollama·그림 엔진) | README 구조, [../Architecture/overview.md](../Architecture/overview.md) |
| `chat-turn.png` | 1:1 대화 한 턴의 처리 순서 | README 구조, [../WORKFLOW.md](../WORKFLOW.md) |
| `world-flow.png` | 월드코퍼챗 한 턴의 처리 순서 (2026-11-06) | README 월드코퍼챗, [../plan/WORLD_COPPERCHAT.md](../plan/WORLD_COPPERCHAT.md), [../Architecture/data-flow.md](../Architecture/data-flow.md) |
| `features.png` | 기능 지도 12칸 (2026-11-06) | README 둘러보기, [../FEATURES.md](../FEATURES.md) |
| `intro-poster.jpg` | 소개 영상 포스터 | README 소개 영상 |

구조 그림 (`node scripts/readme-media/diagrams.mjs`, 2026-11-06):

| 파일 | 내용 | 쓰는 곳 |
|------|------|---------|
| `layers.png` | 계층 구조(Next · Nest · FastAPI) | docs/README, Architecture/overview·layers, PROJECT_STRUCTURE, AI_MODEL_STRATEGY, AGENT_HANDOVER, README |
| `deploy-topology.png` | 운영 배포(Caddy·web·console·api·postgres·migrate·ai·ollama, 망·볼륨) | Architecture/docker-topology, DEPLOYMENT, web_management/docker-deploy, README |
| `dev-environments.png` | 개발·e2e·README 데모 포트와 DB | Architecture/docker-topology, guidance/getting-started, web_management/ports-inventory |
| `data-map.png` | 테이블 37개 영역별 지도 | plan/DATABASE, Architecture/data-flow, AGENT_HANDOVER, README |
| `screen-map.png` | 이용자 화면 35개·콘솔 12개 | Architecture/apps, plan/NAVIGATION_IA |
| `ci-pipeline.png` | CI 두 잡의 단계 | plan/TESTING |

### 실제 앱을 찍은 것

데모 환경(`servers.mjs`: 데모 전용 DB `codicomperchat_readme`, 포트 3201·3202·4201·8201, `ADULT_MODE=off`, `example.com` 가짜 계정)에서 실제 모델로 찍었다.

| 파일 | 만든 스크립트 | 내용 |
|------|---------------|------|
| `home-light.jpg` `home-dark.jpg` | `capture.mjs` | 홈(한국 시각에 따라 테마가 바뀌어 `data-theme`을 보고 이름을 정한다) |
| `character.jpg` `chat.jpg` `chat-recommend.jpg` `story.jpg` `memories.jpg` | `capture.mjs` | 캐릭터 상세, 대화(실제 `gemma4:e4b` 답), 추천 프로필, 지난 이야기, 기억 |
| `ops-menu.jpg` `ops-mind.jpg` `ops-diary.jpg` `ops-community.jpg` | `capture.mjs` | 오퍼레이션 |
| `photonet.jpg` `webtoon.jpg` | `capture.mjs` | 코디포토넷·웹툰(실제 그림 엔진. 처음 나온 그림을 고르지 않고 썼다) |
| `studio.jpg` `studio-portrait.jpg` | `capture.mjs` | 공방, AI 초상 후보 |
| `pricing.jpg` `settings.jpg` `mobile-chat.jpg` | `capture.mjs` | 요금, 설정, 390px 화면 |
| `console-dashboard.jpg` `console-content.jpg` `console-characters.jpg` | `capture.mjs` | 운영 콘솔 |
| `world-list.jpg` `world-detail.jpg` | `world.mjs` | 월드 목록, 세계관 소개(전체 페이지) |
| `world-editor-cast.jpg` `world-editor-map.jpg` `world-editor-parts.jpg` | `world.mjs` | 세계관 편집기 |
| `world-play-chat.jpg` `world-play-visual-novel.jpg` `world-play-novel.jpg` `world-play-messenger.jpg` | `world.mjs` | 대화 방식 4가지(진행자 답은 실제 모델) |
| `world-play-map.jpg` | `world.mjs` | 플레이 중 코퍼맵 |
| `world-event.jpg` `world-event-result.jpg` | `world.mjs` | 이벤트 미니게임과 결과(종류는 무작위라 찍을 때마다 다를 수 있다) |
| `world-mobile.jpg` | `world.mjs` | 390px 메신저형 |
| `console-worlds.jpg` `console-world-detail.jpg` `console-world-events.jpg` `console-world-settings.jpg` | `world.mjs` | 운영 콘솔 월드코퍼챗 |

월드 화면의 **지도·장면 그림·인물 그림은 그림 엔진이 아니라 `art.mjs`의 `DEMO_ART`(HTML)** 다. 이용자가 올리는 그림 자리를 채우는 예시다.

### 움직이는 것

| 파일 | 크기(대략) | 내용 |
|------|-----------|------|
| `demo-chat.gif` | 1.2MB | 이세연에게 말을 걸고 답을 받기 |
| `demo-image.gif` | 3.5MB | 코디포토넷 그림과 웹툰 |
| `intro.mp4` | 1.7MB, 55초 | 소개 영상(H.264). GitHub는 저장소 안 mp4를 README에 바로 재생하지 않아 포스터를 누르면 열린다 |

## 규칙

- **새 그림은 다시 만들 수 있게** 스크립트에 넣는다. 손으로 편집한 그림을 두지 않는다.
- **실제가 아닌 것은 밝힌다.** HTML로 그린 데모 그림, 미리 그려 둔 그림(소개 영상), 가짜 계정을 README에 적는다.
- **개인정보·비밀값을 찍지 않는다.** 데모 계정은 `example.com`, 데모 DB는 개발 DB와 따로다.
- **크기:** 한 파일 5MB 아래(지금 가장 큰 것은 `demo-image.gif` 약 3.5MB). 사진류는 JPEG 82%, 그림·도표는 PNG.
- **저장소가 공개면 그림도 공개다.** 2026-11-06 확인 때 저장소는 공개였다.
- 옛 커밋 기록(`docs/branchs/commits/`)의 `docs/assets/` 경로는 그때의 사실이라 고치지 않는다.

## 다시 만들기 (요약)

```bash
node scripts/readme-media/art.mjs           # 배너·도표·기능 지도 (서버 필요 없음)
node scripts/readme-media/servers.mjs       # 데모 서버 켜 두기 (운영 빌드 필요: npm run test:e2e 한 번)
node scripts/readme-media/capture.mjs       # 1:1 대화·그림·공방·콘솔 (그림 엔진 포함 약 10분)
node scripts/readme-media/world.mjs         # 월드코퍼챗 (약 3분)
node scripts/readme-media/tour.mjs          # 소개 영상 녹화
FFMPEG=<H.264 ffmpeg> node scripts/readme-media/build.mjs   # mp4·gif
```
