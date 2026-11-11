<p align="center">
  <img src="docs/.assets/readme/banner.png" alt="코디컴퍼챗: 어제의 이야기를 기억하는 캐릭터와 이어 가는 캠페인" width="100%">
</p>

<p align="center">
  <b>개발 단계 · 공개 서비스 전</b> ·
  <a href="#소개-영상">소개 영상</a> ·
  <a href="#이-저장소를-읽는-법">읽는 법</a> ·
  <a href="#로직-구조">로직 구조</a> ·
  <a href="#월드코퍼챗">월드코퍼챗</a> ·
  <a href="#둘러보기">둘러보기</a> ·
  <a href="#구조">구조</a> ·
  <a href="#품질을-어떻게-재나">품질</a> ·
  <a href="#실행하기">실행하기</a> ·
  <a href="#문서-지도">문서</a>
</p>

<p align="center">
  <a href="./LICENSE"><img alt="라이선스: 독점, 오픈소스 아님" src="https://img.shields.io/badge/License-독점_·_오픈소스_아님-b91c1c?style=for-the-badge&logo=opensourceinitiative&logoColor=white" /></a>
  <a href="./SECURITY.md"><img alt="보안 정책" src="https://img.shields.io/badge/Security-정책_보기-111827?style=for-the-badge&logo=hackerone&logoColor=white" /></a>
  <a href="./docs/README.md"><img alt="문서 허브" src="https://img.shields.io/badge/Docs-문서_허브-6d4dff?style=for-the-badge&logo=readthedocs&logoColor=white" /></a>
  <a href="#소개-영상"><img alt="개발 단계, 공개 서비스 전" src="https://img.shields.io/badge/Status-개발_단계-f59e0b?style=for-the-badge&logo=statuspage&logoColor=white" /></a>
</p>

<p align="center">
  <a href="https://nextjs.org"><img alt="Next.js 16" src="https://img.shields.io/badge/Next.js_16-000000?logo=nextdotjs&logoColor=white" /></a>
  <a href="https://react.dev"><img alt="React 19" src="https://img.shields.io/badge/React_19-20232A?logo=react&logoColor=61DAFB" /></a>
  <a href="https://www.typescriptlang.org"><img alt="TypeScript 6" src="https://img.shields.io/badge/TypeScript_6-3178C6?logo=typescript&logoColor=white" /></a>
  <a href="https://nestjs.com"><img alt="Nest.js 12" src="https://img.shields.io/badge/Nest.js_12-E0234E?logo=nestjs&logoColor=white" /></a>
  <a href="https://www.prisma.io"><img alt="Prisma 7" src="https://img.shields.io/badge/Prisma_7-2D3748?logo=prisma&logoColor=white" /></a>
  <a href="https://www.postgresql.org"><img alt="PostgreSQL 16" src="https://img.shields.io/badge/PostgreSQL_16-4169E1?logo=postgresql&logoColor=white" /></a>
  <a href="https://fastapi.tiangolo.com"><img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white" /></a>
  <a href="https://www.python.org"><img alt="Python 3.12" src="https://img.shields.io/badge/Python_3.12-3776AB?logo=python&logoColor=white" /></a>
  <a href="https://ollama.com"><img alt="Ollama" src="https://img.shields.io/badge/Ollama-000000?logo=ollama&logoColor=white" /></a>
  <a href="https://pytorch.org"><img alt="PyTorch 2.10" src="https://img.shields.io/badge/PyTorch_2.10-EE4C2C?logo=pytorch&logoColor=white" /></a>
  <a href="https://huggingface.co/docs/diffusers"><img alt="Hugging Face diffusers" src="https://img.shields.io/badge/diffusers-FFD21E?logo=huggingface&logoColor=000" /></a>
  <a href="https://playwright.dev"><img alt="Playwright" src="https://img.shields.io/badge/Playwright-2EAD33?logo=playwright&logoColor=white" /></a>
  <a href="https://vitest.dev"><img alt="Vitest" src="https://img.shields.io/badge/Vitest-6E9F18?logo=vitest&logoColor=white" /></a>
  <a href="https://www.docker.com"><img alt="Docker Compose" src="https://img.shields.io/badge/Docker_Compose-2496ED?logo=docker&logoColor=white" /></a>
  <a href="https://caddyserver.com"><img alt="Caddy" src="https://img.shields.io/badge/Caddy-1F88C0?logo=caddy&logoColor=white" /></a>
  <a href="https://github.com/features/actions"><img alt="GitHub Actions" src="https://img.shields.io/badge/GitHub_Actions-2088FF?logo=githubactions&logoColor=white" /></a>
</p>

# 코디컴퍼챗 (CodiComperChat)

**유저가 주인공인 이야기를, 성격이 흔들리지 않는 AI 캐릭터가 함께 이어 가는 서비스입니다.** 대화를 닫았다 다시 열어도 캐릭터가 지난 일을 자기 입으로 꺼내고, 관계가 쌓이고, 숨겨 둔 비밀과 부탁이 때가 되면 드러납니다.

미리보기는 2026-11-08 기준으로 올라가 있습니다. [웹](https://codicomperchat-web.vercel.app) · [API](https://api.168-110-61-178.sslip.io). 공개 전에 끝낼 확인은 [SECURITY.md](SECURITY.md)에 있고, 그림 엔진·운영 콘솔 연결·메일은 아직입니다.

보통의 캐릭터 채팅과 다른 점은 모델이 아니라 **상태**입니다.

| 보통의 캐릭터 채팅 | 코디컴퍼챗 |
|--------------------|------------|
| 긴 대화가 쌓이면 앞일을 잊는다 | 기억, 요약, 친밀도, 복선을 따로 저장하고 필요한 만큼만 넣는다 |
| 물어보면 없는 개인사를 지어낸다 | 설정에 근거가 없으면 단정하지 않게 막고, 지어냈으면 다시 쓴다 |
| 비밀 설정을 유도하면 털어놓는다 | 비밀을 모델에 아예 보내지 않는다 |
| 대화 말고는 할 게 적다 | 속마음, 일기, 문자, 게시판, 장면 그림, 웹툰으로 이야기가 넓어진다 |
| 캐릭터는 프롬프트 한 덩어리다 | 8단계 카드와 3턴 테스트를 통과해야 발행된다 |
| 한 번에 한 캐릭터와만 이야기한다 | **월드코퍼챗**: 한 세계관 안의 여러 인물과 파트·코퍼맵·미니게임으로 이어 간다 |

> **이 저장소는 오픈소스가 아닙니다.** 허락 없는 clone, 다운로드, 복제, 실행, 호스팅, 모델 학습을 허용하지 않습니다. 저장소는 비공개로 전환할 예정입니다. 자세한 내용은 [LICENSE](LICENSE)를 보세요.

## 이 저장소를 읽는 법

이 파일은 제품의 얼굴입니다. 화면, 경계, 지금 되는 일의 윤곽을 여기서 보고, 자주 바뀌는 수와 함정은 한 문서에만 적습니다. 기획 원본의 문장, 실측 숫자, 날짜가 붙은 커밋 기록은 여기서 다시 쓰지 않습니다.

| 알고 싶은 것 | 문서 |
|--------------|------|
| 제품이 무엇을 지키는지, 화면이 어떻게 생겼는지 | 이 파일 |
| 공개 주소에서 지금 무엇이 켜져 있는지 | [STATUS](docs/STATUS.md) |
| 코드에 어떤 기능이 있는지 | [FEATURES](docs/FEATURES.md) |
| 지금 상태와 걸려 넘어지는 곳 | [AGENT_HANDOVER](docs/AGENT_HANDOVER.md) |
| 값의 정본이 어느 문서인지 | [docs/README.md](docs/README.md)의 문서 정본 표 |
| 기획이 처음에 정한 문장 | [CodiComperChat_project_plan.md](CodiComperChat_project_plan.md) |

<!-- logic-structure -->
## 로직 구조

계층은 네 칸입니다. **웹은 Nest만 알고, Nest만 DB와 AI를 알고, AI는 DB를 모릅니다.**

```mermaid
flowchart TB
  subgraph CLIENT["① 화면 — 판단하지 않는다"]
    direction LR
    WEB["apps/web<br/>Next.js 16 · :3000<br/>서버 컴포넌트 · 서버 액션 · /api 중계"]
    CON["console<br/>Next.js 16 · :3001<br/>운영자 전용"]
  end
  subgraph TRUST["② apps/api — Nest.js 12 · :4000 · 유일한 신뢰 경계"]
    direction LR
    G["Guard<br/>로그인 · 운영자 · 요청 한도"] --> S["Service<br/>권한 · 소유 · 코레딧 · 모델 조건 · 맥락 조립"]
    S --> P["순수 함수<br/>quest · world · card · adult …"]
  end
  subgraph DATA["③ 저장"]
    DB[("PostgreSQL 16<br/>테이블 38개 · 그림도 bytea")]
  end
  subgraph AI["④ services/ai — FastAPI · :8000 · 내부망 전용"]
    direction LR
    EP["/infer · /summarize · /remember · /ground-check<br/>/world/turn · /world/part-check · /photonet …"]
    LLM["대화 모델<br/>기본 gemma4:e4b<br/>강화 gemma-4-31b-it<br/>예비 gemma4:e4b"]
    IMG["그림<br/>diffusers · Animagine · SD 1.5<br/>(NVIDIA GPU 필요)"]
    EP --> LLM
    EP --> IMG
  end
  WEB -- "Bearer (httpOnly 쿠키 → 서버가 붙임)" --> G
  CON -- "Bearer" --> G
  S -- "Prisma" --> DB
  S -- "AI 대기열 + X-AI-Token" --> EP
```

한 턴이 거치는 단계를 스크립트처럼 적으면 이렇습니다. 각 단계는 Nest가 하고, AI는 `call:` 줄만 합니다.

```yaml
chat_turn:                    # 1:1 대화 한 턴 — apps/api/src/chat
  - check:   [로그인, 캐릭터 공개 범위, 성인 조건, 코레딧·모델 reserve]
  - context: [카드 핵심, 지식 조각, 기억(직접 적은 것은 매 턴), 지난 이야기 요약, 친밀도·복선, 퀘스트 장면, 때와 곳]
  - call:    POST /infer
  - guard:   # 설정에 없는 개인사를 물은 턴만
      call:  POST /ground-check
      retry: 지어냈으면 다시 쓰기 (최대 2번)
  - save:    [유저 말, 답, 이야기 상태]
  - every_6_messages_in_background: [POST /remember, POST /summarize]

world_turn:                   # 월드코퍼챗 한 턴 — apps/api/src/worlds
  - expire:  열린 이벤트 → EXPIRED
  - context: [세계관, 등장인물, 장소, 그림 이름표, 지금 파트]
  - call:    POST /world/turn
  - verify:  제어 줄(image · move) 검사 후 떼어 내기
  - save:    [메시지, 인물 위치]
  - every_3_turns: { call: POST /world/part-check, on_done: 다음 파트 }
  - maybe_event: 간격·확률을 넘기면 미니게임 → 서버가 결과·보상 (하루 3번)
```

<!-- logic-mermaid -->

### 시스템 구조

```mermaid
flowchart LR
  B["브라우저"] --> W["apps/web<br/>Next.js :3000"]
  OP["운영자"] --> C["console<br/>Next.js :3001"]
  W -- "Bearer" --> N["apps/api<br/>Nest.js :4000<br/>신뢰 경계"]
  C -- "Bearer" --> N
  N -- "Prisma" --> D[("PostgreSQL 16<br/>테이블 38개")]
  N -- "AI 대기열 + AI_SERVICE_TOKEN" --> A["services/ai<br/>FastAPI :8000"]
  A --> L["대화 모델<br/>NVIDIA API → Ollama 예비"]
  A --> G["diffusers<br/>Animagine · SD 1.5"]
```

### 지금 올라가 있는 배포 (2026-11-07)

```mermaid
flowchart LR
  U(("이용자")) -->|"HTTPS"| V["Vercel · icn1<br/>codicomperchat-web"]
  V -->|"HTTPS · Bearer<br/>X-Web-Proxy-Token"| CA
  subgraph OCI["Oracle Cloud A1.Flex · 도쿄 · ARM · GPU 없음"]
    CA["Caddy 2.10<br/>api.168-110-61-178.sslip.io<br/>80 · 443만 열림"] --> API["api<br/>Nest"]
    API --> PG[("postgres 16")]
    API -->|"X-AI-Token"| AI["ai<br/>FastAPI (CPU)"]
    AI --> OL["ollama<br/>gemma4:e4b 예비"]
  end
  AI -->|"OpenAI 호환"| NIM["NVIDIA 호스팅 API<br/>gemma-4-31b-it"]
```

그림 엔진은 GPU가 없어 잠겨 있고, 운영 콘솔은 API에 연결하지 않았습니다. 위 그림은 2026-11-07에 올린 서버입니다. 2026-11-08 코드는 기본 대화를 로컬 `gemma4:e4b`로 두고 강화만 `gemma-4-31b-it`으로 보내며, 그 구분은 공개 API에 아직 없습니다. 자세한 상태: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

### 1:1 대화 한 턴

```mermaid
sequenceDiagram
  autonumber
  participant B as 브라우저
  participant W as web (Next)
  participant N as api (Nest)
  participant D as PostgreSQL
  participant A as ai (FastAPI)
  B->>W: 메시지 보내기
  W->>N: POST /characters/{id}/chat/live
  N-->>B: 일회용 표 · /ws/chat
  B->>N: WebSocket /ws/chat
  N->>D: 캐릭터·프로필·대화·상태 읽기
  N->>N: 모델 reserve, 맥락 조립 (카드 핵심 · 지식 조각 · 기억 · 이야기 상태)
  N->>A: POST /infer/stream
  loop 로컬 모델이 쓰는 조각
    A-->>N: delta
    N-->>B: 말풍선에 이어 붙이기
  end
  opt 개인사 검사가 답을 고침
    N->>A: POST /ground-check
    N-->>B: 보인 글을 고친 글로 바꾸기
  end
  N->>D: 유저 말 + 답 저장
  N-->>B: done
  Note over N,A: 소켓은 글을 옮길 뿐 추론을 나누지 않는다. 호스팅 모델은 한 덩어리다. 명령어·월드는 답이 끝난 뒤 HTTP
```

### 월드코퍼챗 한 턴

```mermaid
sequenceDiagram
  autonumber
  participant P as 플레이어
  participant N as api (Nest)
  participant A as ai (FastAPI)
  participant D as PostgreSQL
  P->>N: POST /worlds/{id}/play/turn
  N->>D: 열린 이벤트를 EXPIRED로
  N->>N: 기본 모델 reserve, 맥락 조립
  N->>A: POST /world/turn
  A-->>N: reply · image · moves (제어 줄은 떼어 냄)
  N->>D: USER·CHARACTER 메시지, 위치 저장
  alt 3턴마다
    N->>A: POST /world/part-check
    A-->>N: done · evidence
    N->>D: 다음 파트 · SYSTEM 메시지
  end
  opt 간격과 확률을 넘김
    N->>D: WorldEvent 만들기 (숨긴 setup)
  end
  N-->>P: 플레이 상태
```

### 비밀 퀘스트 상태

```mermaid
stateDiagram-v2
  state "잠김" as locked
  state "때가 됨" as ready
  state "건넴 (offered)" as offered
  state "달성 (done)" as done
  state "보상 장면 보임 (staged)" as staged
  [*] --> locked
  locked --> ready: 친밀도 ≥ 문턱
  ready --> offered: 판정 - 캐릭터 대사에 부탁 인용
  offered --> done: 판정 - 유저 대사에 근거 인용, 확신 85+
  done --> staged: 다음 첫 답 한 번 (sceneNote)
  staged --> [*]
```

## 소개 영상

약 55초입니다. 실제로 띄운 앱을 녹화했고, 답은 실제 `gemma4:e4b`가 썼습니다. 그림은 미리 그려 둔 것을 보여 줍니다. 그리는 데 분 단위로 걸려 영상에서 뺐습니다.

[![소개 영상 재생 (MP4)](docs/.assets/readme/intro-poster.jpg)](docs/.assets/readme/intro.mp4)

[**▶ 소개 영상 열기 (MP4, 1.7MB)**](docs/.assets/readme/intro.mp4)

<table>
  <tr>
    <th>말을 걸면 캐릭터가 답한다</th>
    <th>대화 장면이 그림과 웹툰이 된다</th>
  </tr>
  <tr>
    <td><a href="docs/.assets/readme/demo-chat.gif"><img src="docs/.assets/readme/demo-chat.gif" alt="이세연에게 말을 걸고 답을 받는 화면"></a></td>
    <td><a href="docs/.assets/readme/demo-image.gif"><img src="docs/.assets/readme/demo-image.gif" alt="코디포토넷 그림과 웹툰 화면"></a></td>
  </tr>
</table>

## 월드코퍼챗

**1:1 대화가 아니라, 한 세계관 안에서 여러 인물과 이어 가는 이야기입니다.** 누구나 세계관을 만들고(설명·규칙·첫 장면·등장인물·장소·파트·장면 그림), 진행자 모델이 등장인물을 번갈아 연기합니다. 소설·영화·게임처럼 1부, 2부로 줄거리가 흐르고, 대화 중에 갑자기 미니게임이 열립니다.

<table>
  <tr>
    <td width="50%"><a href="docs/.assets/readme/world-play-chat.jpg"><img src="docs/.assets/readme/world-play-chat.jpg" alt="기본 채팅형: 인물별 말풍선과 상황에 맞게 고른 장면 그림"></a></td>
    <td width="50%"><a href="docs/.assets/readme/world-play-visual-novel.jpg"><img src="docs/.assets/readme/world-play-visual-novel.jpg" alt="비주얼노벨형: 장면 그림 배경, 서 있는 인물, 한 줄씩 넘기는 대사 상자"></a></td>
  </tr>
  <tr>
    <td><b>기본 채팅형.</b> 인물마다 말풍선이 따로 있고, 제작자가 이름표를 붙여 올린 장면 그림 중 지금 장면에 맞는 것을 진행자가 골라 함께 보여 줍니다.</td>
    <td><b>비주얼노벨형.</b> 장면 그림이 배경이 되고, 말하는 인물의 그림이 서 있고, 대사 상자를 눌러 한 줄씩 넘깁니다.</td>
  </tr>
  <tr>
    <td><a href="docs/.assets/readme/world-play-novel.jpg"><img src="docs/.assets/readme/world-play-novel.jpg" alt="소설형: 세리프 산문 문단과 삽화"></a></td>
    <td><a href="docs/.assets/readme/world-play-messenger.jpg"><img src="docs/.assets/readme/world-play-messenger.jpg" alt="메신저형: 카톡처럼 짧은 메시지가 오가는 단체 대화방"></a></td>
  </tr>
  <tr>
    <td><b>소설형.</b> 3인칭 산문 문단으로 이어지고, 내 말은 인용처럼 끼어듭니다.</td>
    <td><b>메신저형.</b> 단체 대화방처럼 짧은 메시지가 오갑니다. 장면 서술과 행동 묘사는 쓰지 않습니다.</td>
  </tr>
</table>

<table>
  <tr>
    <td width="58%"><a href="docs/.assets/readme/world-play-map.jpg"><img src="docs/.assets/readme/world-play-map.jpg" alt="코퍼맵: 지도 위 장소 핀과 지금 인물이 있는 곳"></a></td>
    <td width="42%"><a href="docs/.assets/readme/world-event.jpg"><img src="docs/.assets/readme/world-event.jpg" alt="대화 중 갑자기 열린 미로 찾기 이벤트"></a><br><br><a href="docs/.assets/readme/world-event-result.jpg"><img src="docs/.assets/readme/world-event-result.jpg" alt="이벤트 결과와 코레딧 보상"></a></td>
  </tr>
  <tr>
    <td><b>코퍼맵.</b> 제작자가 올린 지도 위에 장소 핀이 있고, 인물이 지금 있는 곳의 핀이 분홍색으로 표시됩니다.</td>
    <td><b>이벤트 미니게임.</b> 사다리·주사위·미니 볼링·제비뽑기·미로 찾기. 결과는 서버가 정하고, 이기면 20~50, 져도 5~10 코레딧(하루 3번까지).</td>
  </tr>
</table>

<table>
  <tr>
    <td width="34%"><a href="docs/.assets/readme/world-editor-cast.jpg"><img src="docs/.assets/readme/world-editor-cast.jpg" alt="세계관 편집기: 등장인물을 데려오거나 직접 쓴다"></a></td>
    <td width="33%"><a href="docs/.assets/readme/world-editor-map.jpg"><img src="docs/.assets/readme/world-editor-map.jpg" alt="세계관 편집기: 지도를 눌러 장소 핀을 놓는다"></a></td>
    <td width="33%"><a href="docs/.assets/readme/world-editor-parts.jpg"><img src="docs/.assets/readme/world-editor-parts.jpg" alt="세계관 편집기: 파트와 끝나는 조건"></a></td>
  </tr>
  <tr>
    <td colspan="3"><b>세계관 편집기.</b> 기본(설명·규칙·첫 장면·대화 방식) · 등장인물(공개 캐릭터를 데려오거나 직접 쓰기) · 장소·코퍼맵 · 파트 · 장면 그림(자동 검수) · 발행(공개 범위). 파트의 끝나는 조건은 플레이어에게 보이지 않고, 판정 모델이 3턴마다 근거 인용으로 확인합니다.</td>
  </tr>
</table>

<a href="docs/.assets/readme/world-flow.png"><img src="docs/.assets/readme/world-flow.png" alt="월드코퍼챗 한 턴의 처리 순서" width="100%"></a>

**모델은 고르기만 하고, 확인과 돈이 걸린 일은 코드가 합니다.** 진행자가 없는 그림 이름표·인물·장소를 지어내도 화면에 나가지 않고, 미니게임의 당첨 위치·볼링 커브·미로 판정은 서버에만 있습니다. 실측(진행자 형식 23/24)과 한계(인물의 장소 이동을 거의 쓰지 않음)는 [docs/trainings/world-copperchat.md](docs/trainings/world-copperchat.md), 설계는 [docs/plan/WORLD_COPPERCHAT.md](docs/plan/WORLD_COPPERCHAT.md).

> 위 화면의 진행자 답은 실제 `gemma4:e4b`가 썼습니다. 지도·장면 그림·인물 그림은 그림 엔진이 아니라 HTML로 그린 데모 그림입니다(`scripts/readme-media/art.mjs`).

## 둘러보기

<a href="docs/.assets/readme/features.png"><img src="docs/.assets/readme/features.png" alt="기능 지도: 대화·퀘스트·오퍼레이션·그림·월드코퍼챗·공방·코레딧·수위·운영" width="100%"></a>

아래 화면은 모두 데모 계정으로 실제 앱에서 찍었습니다. 대사와 그림은 모델이 만든 그대로이고, 고르거나 다듬지 않았습니다.

### 대화는 이어지고, 쌓인다

<table>
  <tr>
    <td width="50%"><a href="docs/.assets/readme/chat.jpg"><img src="docs/.assets/readme/chat.jpg" alt="캐릭터와의 대화 화면"></a></td>
    <td width="50%"><a href="docs/.assets/readme/story.jpg"><img src="docs/.assets/readme/story.jpg" alt="지난 이야기: 친밀도, 요약, 복선"></a></td>
  </tr>
  <tr>
    <td><b>대화.</b> <code>*행동*</code>은 회색 기울임으로, 장면 전환은 <code>@:</code> 나레이션으로 그립니다. 1:1 답은 로컬 모델이 쓰는 대로 말풍선에 채워집니다. 소켓은 글을 옮길 뿐이고 모델이 빨라지지는 않습니다. 대답 추천, <code>/다시</code> <code>/계속</code> <code>/되돌리기</code> 명령어, 모델 고르기가 있습니다. 마지막 말풍선 옆에만 점 세 개 메뉴가 있고, 그 줄만 고치거나 지우거나 방향을 적어 다시 씁니다. 때와 곳은 대화 위에 있고, 시간·장소 단서가 있을 때만 바뀝니다.</td>
    <td><b>지난 이야기.</b> 대화 3번마다 뒤에서 요약하고 친밀도와 복선을 갱신합니다. 잘못 잡힌 복선은 유저가 지울 수 있습니다.</td>
  </tr>
  <tr>
    <td><a href="docs/.assets/readme/chat-recommend.jpg"><img src="docs/.assets/readme/chat-recommend.jpg" alt="추천 프로필 카드"></a></td>
    <td><a href="docs/.assets/readme/memories.jpg"><img src="docs/.assets/readme/memories.jpg" alt="장기 기억 목록"></a></td>
  </tr>
  <tr>
    <td><b>추천 프로필.</b> 캐릭터에 어울리는 주인공을 눌러서 바로 시작합니다.</td>
    <td><b>장기 기억.</b> 대화에서 뽑은 사실을 유저가 직접 보고 지웁니다. 유저가 직접 적은 기억은 매 턴 넣고, 모델이 뽑은 기억은 지금 말과 맞을 때만 꺼냅니다.</td>
  </tr>
</table>

### 오퍼레이션: 대화 밖으로 넓히기

<table>
  <tr>
    <td width="33%"><a href="docs/.assets/readme/ops-mind.jpg"><img src="docs/.assets/readme/ops-mind.jpg" alt="심리 탐구"></a></td>
    <td width="33%"><a href="docs/.assets/readme/ops-diary.jpg"><img src="docs/.assets/readme/ops-diary.jpg" alt="일기"></a></td>
    <td width="33%"><a href="docs/.assets/readme/ops-community.jpg"><img src="docs/.assets/readme/ops-community.jpg" alt="커뮤니티"></a></td>
  </tr>
  <tr>
    <td><b>심리 탐구.</b> 겉으로 하지 않은 속마음을 엿봅니다. 설정의 비밀은 드러나지 않습니다.</td>
    <td><b>일기.</b> 캐릭터가 함께 겪은 일을 1인칭으로 적습니다.</td>
    <td><b>커뮤니티.</b> 그 세계의 주민들이 쓰는 가상 게시판입니다. 나에게만 보입니다.</td>
  </tr>
</table>

메시지(문자)도 있습니다. 대화와 따로 쌓이고 코레딧이 들지 않습니다.

### 그림: 코디포토넷과 웹툰

<table>
  <tr>
    <td width="60%"><a href="docs/.assets/readme/photonet.jpg"><img src="docs/.assets/readme/photonet.jpg" alt="코디포토넷 창"></a></td>
    <td width="40%" rowspan="2"><a href="docs/.assets/readme/webtoon.jpg"><img src="docs/.assets/readme/webtoon.jpg" alt="웹툰 3컷"></a></td>
  </tr>
  <tr>
    <td>
      <b>코디포토넷.</b> 등장인물과 줄거리, 고른 대사를 읽고 장면을 설계한 뒤 그립니다. 화풍 4가지, 비율 3가지입니다. 모든 그림은 검수를 지나야 돌아오고, 막히면 코레딧을 돌려줍니다.<br><br>
      <b>웹툰.</b> 콘티는 무료이고 컷을 하나씩 그립니다. 오른쪽은 실제 결과입니다. 같은 인물의 머리색이 컷마다 다른 것처럼, <b>컷 사이 일관성은 아직 약합니다</b>.
    </td>
  </tr>
</table>

### 캐릭터 공방: 누구나 만들고, 테스트를 통과해야 공개한다

<table>
  <tr>
    <td width="70%"><a href="docs/.assets/readme/studio.jpg"><img src="docs/.assets/readme/studio.jpg" alt="캐릭터 공방 편집기"></a></td>
    <td width="30%"><a href="docs/.assets/readme/studio-portrait.jpg"><img src="docs/.assets/readme/studio-portrait.jpg" alt="AI 초상 후보"></a></td>
  </tr>
  <tr>
    <td>정체성부터 말투, 비밀, 첫인사, 로어북, 비밀 퀘스트까지 8단계 카드로 씁니다. 칸마다 AI 초안을 받을 수 있고, 3턴 테스트에서 말투 붕괴, 강의식 답, 메타 발언, 비밀 누설을 판정합니다.</td>
    <td>AI 초상은 후보를 비교해 고른 그림만 저장합니다.</td>
  </tr>
</table>

### 비밀 퀘스트

친밀도가 문턱을 넘으면 캐릭터가 이야기 속 부탁을 먼저 꺼냅니다. 달성 조건은 캐릭터 모델에게 알리지 않습니다. 코드가 인용 근거를 실제 대사와 대조해 달성을 판정합니다.

### 어디서나, 운영까지

<table>
  <tr>
    <td width="25%"><a href="docs/.assets/readme/mobile-chat.jpg"><img src="docs/.assets/readme/mobile-chat.jpg" alt="모바일 대화 화면"></a></td>
    <td width="37%"><a href="docs/.assets/readme/home-light.jpg"><img src="docs/.assets/readme/home-light.jpg" alt="밝은 테마 홈"></a><br><br><a href="docs/.assets/readme/home-dark.jpg"><img src="docs/.assets/readme/home-dark.jpg" alt="어두운 테마 홈"></a></td>
    <td width="38%"><a href="docs/.assets/readme/console-dashboard.jpg"><img src="docs/.assets/readme/console-dashboard.jpg" alt="운영 콘솔 대시보드"></a><br><br><a href="docs/.assets/readme/console-content.jpg"><img src="docs/.assets/readme/console-content.jpg" alt="운영 콘솔 그림 신고"></a></td>
  </tr>
  <tr>
    <td>좁은 화면</td>
    <td>라이트·다크. 한국 시각에 따라 자동으로 바뀝니다.</td>
    <td>운영 콘솔. 신고, 초상 검수, 그림 신고, 계정 정지, 생년월일 정정을 처리합니다.</td>
  </tr>
</table>

<table>
  <tr>
    <td width="22%"><a href="docs/.assets/readme/world-mobile.jpg"><img src="docs/.assets/readme/world-mobile.jpg" alt="모바일 메신저형 월드 플레이"></a></td>
    <td width="39%"><a href="docs/.assets/readme/console-worlds.jpg"><img src="docs/.assets/readme/console-worlds.jpg" alt="운영 콘솔 월드코퍼챗 목록과 숫자"></a><br><br><a href="docs/.assets/readme/console-world-detail.jpg"><img src="docs/.assets/readme/console-world-detail.jpg" alt="운영 콘솔 세계관 상세: 파트 목표와 그림 검수"></a></td>
    <td width="39%"><a href="docs/.assets/readme/console-world-events.jpg"><img src="docs/.assets/readme/console-world-events.jpg" alt="운영 콘솔 이벤트 기록"></a><br><br><a href="docs/.assets/readme/console-world-settings.jpg"><img src="docs/.assets/readme/console-world-settings.jpg" alt="운영 콘솔 월드 운영 설정"></a></td>
  </tr>
  <tr>
    <td>좁은 화면의 메신저형</td>
    <td>콘솔의 월드코퍼챗: 숫자 줄, 찾기·거르기, 내리기(사유 필수). 상세에서는 플레이어에게 숨긴 파트 목표와 그림 검수를 봅니다.</td>
    <td>이벤트 기록(결과·보상·한도 초과)과 운영 설정(하루 보상 횟수·이벤트 확률·간격). 플레이 대화 내용은 콘솔에 보이지 않습니다.</td>
  </tr>
</table>

## 지금 되는 것

| 영역 | 내용 | 상태 |
|------|------|------|
| 계정 | 이메일 가입·인증, 비밀번호 찾기, 탈퇴, 나이 확인 | 동작 |
| 대화 | 기억, 지난 이야기, 친밀도, 복선, 엑스트라, 새로하기·이어하기, 대답 추천, 명령어, 글 꾸미기, 마지막 대사 수정·삭제·방향 다시 쓰기, 직접 적는 기억, 때와 곳 | 동작 |
| 캐릭터 공방 | 8단계 카드, AI 초안, 3턴 테스트, 초상(파일·AI), 공개 범위, 추천 프로필 | 동작 |
| 공식 캐릭터 | 유지성(과외 선생님), 이세연(회장 비서), 각자 비밀 퀘스트 | 동작 |
| 오퍼레이션 | 심리 탐구, 일기, 메시지, 커뮤니티, 웹툰 | 동작 |
| 월드코퍼챗 | 세계관 만들기·발행, 등장인물 데려오기, 대화 방식 4가지, 파트, 코퍼맵, 장면 그림, 이벤트 미니게임 5종과 보상 | 동작 (2026-11-06) |
| 코디포토넷 | 대화 장면 그림, 화풍 4가지 | 동작. NVIDIA GPU 필요 |
| 코레딧 | 출석, 차감, 실패 시 환불 | 동작 |
| 프로 등급 | 눌러서 30일 프로로 바꾸기 | 정식 서비스 전 임시 |
| 운영 | 운영 콘솔(세계관 검수·내리기·이벤트 기록·운영 설정 포함), 요청 한도, CSP, 신고, 백업 | 동작 |
| 프리미엄 모델 | Claude, Grok 연동 코드, 월 지출 상한, 만 18세 미만 차단 | 코드 있음, 키가 없어 닫힘. 실제 호출은 하지 않았다. 서버 `.env`에 자리는 있다 |
| 대화 모델 백엔드 | 기본은 로컬 `gemma4:e4b`, 강화는 키가 있으면 NVIDIA `gemma-4-31b-it`, 막히면 예비 `gemma4:e4b` | 코드는 2026-11-08. 공개 API는 그 전 이미지라 구분이 없다 (2026-11-07 실측) |
| 배포 | Oracle Cloud(API·DB·AI) + Vercel(웹) | 미리보기 (2026-11-07). 그림 엔진·운영 콘솔 연결·메일은 아직. 공개 서비스 전 |
| 프로젝트 소개 | 웹 `/project` | 웹에 있음 (2026-11-07) |
| 포트폴리오 사이트 | 별도 Astro `https://codicomperchat-portfolio.vercel.app` | 정적 페이지만. 챗봇 서버는 없음. 로컬 챗봇 모델은 `gemma4:e4b` 하나 |
| 성인 모드 | 수위 분리(그림·대화), 성인 확인, 미성년자·강제 단서 차단, 그림 가드, 신고. 성인 대화는 로컬 모델에서만 | 코드 있음, 공개 서버에서는 끈다 |
| 실제 결제 | 토스페이먼츠 연동 | 코드 있음, 보류 |
| 1:1 답 표시 | 로컬 모델 토큰을 웹소켓으로 바로 보여 줌. 호스팅 모델은 한 덩어리. 월드·명령어는 답이 끝난 뒤 | 코드 있음 (2026-11-09). 공개 API는 이 소켓을 아직 모름. 추론은 나누지 않음 |
| 본인인증 | | 없음 |

이 표의 **동작**은 코드가 로컬에서 된다는 뜻입니다. 공개 주소에서 지금 열리는 범위는 [docs/STATUS.md](docs/STATUS.md)에 따로 있습니다.

**2026-11-07에 실제로 올렸습니다.** 웹은 Vercel(https://codicomperchat-web.vercel.app), API·DB·AI는 Oracle Cloud(https://api.168-110-61-178.sslip.io)에서 돕니다. 올린 과정과 막힌 곳 전부: [deploy-log-2026-11-07](docs/web_management/deploy-log-2026-11-07.md). 공개 전에 끝낼 일은 [SECURITY.md](SECURITY.md)의 "공개 전 필수"와 [소유자 체크리스트](docs/guidance/owner-checklist.md)에 있습니다.

## 구조

### 기술 스택

<a href="docs/.assets/readme/stack.png"><img src="docs/.assets/readme/stack.png" alt="기술 스택: Next.js 16, Nest.js 12, Prisma 7, PostgreSQL 16, FastAPI, Ollama, diffusers, Playwright, Docker Compose" width="100%"></a>

### 시스템 구조

<a href="docs/.assets/readme/architecture.png"><img src="docs/.assets/readme/architecture.png" alt="시스템 구조도: 웹과 콘솔이 Nest를 부르고, Nest가 PostgreSQL과 FastAPI를 부르며, FastAPI가 Ollama와 그림 엔진을 쓴다" width="100%"></a>

**웹은 FastAPI를 직접 부르지 않습니다.** 인증, 권한, 코레딧, 맥락 조립은 모두 Nest에서 합니다. FastAPI는 DB를 보지 않고 Nest가 조립해 넘긴 조각만 씁니다. Redis는 쓰지 않습니다. 대화 기억과 공통 말투만 ChromaDB에 로컬 벡터로 담습니다. 가중치 학습은 하지 않습니다.

<a href="docs/.assets/readme/chat-turn.png"><img src="docs/.assets/readme/chat-turn.png" alt="대화 한 턴의 처리 순서" width="100%"></a>

### 더 자세한 구조 그림

<table>
  <tr>
    <td width="50%"><a href="docs/.assets/readme/layers.png"><img src="docs/.assets/readme/layers.png" alt="계층 구조: Next → Nest → FastAPI"></a></td>
    <td width="50%"><a href="docs/.assets/readme/deploy-topology.png"><img src="docs/.assets/readme/deploy-topology.png" alt="운영 배포 구성: Caddy, web, console, api, postgres, ai, ollama"></a></td>
  </tr>
  <tr>
    <td><b>계층.</b> 웹은 FastAPI를 모르고, FastAPI는 DB를 모릅니다. 판단은 Nest의 순수 함수에 모아 DB 없이 시험합니다.</td>
    <td><b>운영 배포(목표).</b> GPU 서버 한 대, 바깥에는 Caddy의 80·443만 열립니다. 지금 올라가 있는 구성은 위 "로직 구조"의 배포 그림입니다.</td>
  </tr>
  <tr>
    <td><a href="docs/.assets/readme/data-map.png"><img src="docs/.assets/readme/data-map.png" alt="데이터 지도: 테이블 37개"></a></td>
    <td><a href="docs/.assets/readme/screen-map.png"><img src="docs/.assets/readme/screen-map.png" alt="화면 지도: 이용자 35개, 콘솔 12개"></a></td>
  </tr>
  <tr>
    <td><b>데이터.</b> 지금은 테이블 38개. 그림은 37개일 때다. 돈과 횟수는 DB 한 문장으로 셉니다.</td>
    <td><b>화면.</b> 이용자 사이트 35개, 운영 콘솔 13개. 그림은 콘솔 12개일 때다.</td>
  </tr>
</table>

모든 구조 그림과 설명: [docs/README.md#구조-그림-한눈에](docs/README.md#구조-그림-한눈에)

### 저장소 구성

```text
CodiComperChat/
├── apps/
│   ├── web/          Next.js 이용자 사이트          :3000
│   └── api/          Nest.js 도메인/상태 API        :4000
├── console/          Next.js 운영자 콘솔            :3001
├── services/
│   └── ai/           FastAPI 추론·그림 엔진          :8000 (내부망 전용)
├── e2e/              Playwright 화면 자동 테스트
├── deploy/           운영 구성 (GPU 서버 한 대 · oracle/ 지금 서버 · ai-node/ GPU 노드)
├── scripts/          로컬 CI·커밋 기록·DB 백업·비밀값 생성·README 그림 만들기
├── docs/             문서 허브 (기획·아키텍처·Git 기록·가이드·실측 노트)
├── .agents/          AI 에이전트 공통 규칙 정본
├── .claude/ .cursor/ .codex/ .grok/ .antigravity/ .gemini/ .manus/ .kimi/ .ollama/ .opencode/ .qwen/ .windsurf/   도구별 어댑터
├── docker-compose.yml   개발용 (선택) PostgreSQL·Mailpit
├── LICENSE  SECURITY.md  THIRD_PARTY_NOTICES.md
└── CodiComperChat_project_plan.md   기획 원본
```

| 파트 | 스택 | 역할 | 자세히 |
|------|------|------|--------|
| `apps/web` | Next.js 16, React 19, TypeScript, CSS Modules | 이용자 사이트. 요청마다 nonce CSP, 라이트·다크 | [README](apps/web/README.md) |
| `console` | Next.js 16 | 운영자 전용. 쿠키와 배포를 나눈다 | [README](console/README.md) |
| `apps/api` | Nest.js 12 (ESM), Prisma 7, PostgreSQL 16 | 유일한 공개 백엔드이자 신뢰 경계 | [README](apps/api/README.md) |
| `services/ai` | FastAPI, Python 3.12, Ollama, diffusers | 연기, 요약, 판정, 그림. `/train`은 정책상 403 | [README](services/ai/README.md) |
| `e2e` | Playwright | 가짜 LLM과 운영 빌드로 화면 흐름 시험 | [README](e2e/README.md) |
| `deploy` | Docker Compose, Caddy | GPU 서버 한 대 구성(`docker-compose.prod.yml`)과 지금 운영 중인 Oracle 구성(`oracle/`) | [DEPLOYMENT](docs/DEPLOYMENT.md) |

## 품질을 어떻게 재나

**자체 모델을 학습하지 않습니다.** 대신 프롬프트, 맥락, 판정을 실제 모델로 재고 고칩니다. 대화 품질은 코드 시험으로 잡히지 않아 평가를 따로 둡니다.

아래는 2026-11-06에 `gemma4:e4b`로 돌린 결과입니다. 잘 안 되는 항목도 그대로 적습니다.

| 평가 | 결과 | 기준 | |
|------|------|------|---|
| 말투 유지 | 12/12 | 90% | ✅ |
| 말투 바꾸기 요구를 지키는가 | 12/12 | 80% | ✅ |
| "너 AI지?" 유도 | 12/12 | 95% | ✅ |
| 강의식 답을 하지 않는가 | 8/8 | 90% | ✅ |
| 설정에 없는 개인사를 단정하지 않는가 | 11/12 | 90% | ✅ |
| 판정·검수 안정성, 정상 그림 통과 | 전부 통과 | | ✅ |
| 웹툰 콘티 | 3/4 | 75% | ✅ |
| 비밀 퀘스트 판정 (이세연 / 유지성) | 20/20, 15/16 | 잘못 통과 0 | ✅ 잘못 통과 0건 |
| 장면 전환 나레이션 | 48/48 (고치기 전 7/12) | 80% | ✅ |
| 퀘스트 보상 장면 | 20/20, 갈래 고르기 6/6 (고치기 전 2/8) | 75% | ✅ |
| 월드 진행자 형식 (방식 4가지) | 23/24 | 80% | ✅ |
| 성인 수위에서도 강제 장면 거부 | 16/16 | 100% | ✅ |

분석과 이전 결과 비교: [docs/trainings/](docs/trainings/README.md). 코드 시험 수와 방법: [docs/plan/TESTING.md](docs/plan/TESTING.md).

## 실행하기

**이 절은 권리자와 허락받은 사람을 위한 것입니다.** 필요한 것: Node 24, Python 3.12, PostgreSQL 16, [Ollama](https://ollama.com)(`gemma4:e4b`). 그림 기능은 NVIDIA GPU(12GB 권장)가 있어야 하고, 없으면 코디포토넷과 웹툰만 "준비 중"으로 잠깁니다.

```bash
# 1) DB — 로컬 PostgreSQL 16 (설치·초기 설정: docs/guidance/docker-run.md)
#    개발 메일은 `docker compose up -d mailpit` (선택)

# 2) web + api + console (저장소 루트에서)
npm install
cp apps/api/.env.example apps/api/.env     # AUTH_SECRET 등을 채운다
(cd apps/api && npx prisma migrate deploy && npm run prisma:seed)   # 테이블 만들기 + 공식 캐릭터(유지성·이세연)
npm run dev:api                            # http://localhost:4000
npm run dev:web                            # http://localhost:3000
npm run dev:console                        # http://localhost:3001 (운영자)

# 3) ai (별도 터미널)
cd services/ai
py -3.12 -m venv .venv                                         # 최초 1회
./.venv/Scripts/python.exe -m pip install -r requirements.txt  # 최초 1회
cp .env.example .env
./.venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8000

# 4) (선택) 그림 엔진 — 코디포토넷·웹툰
./.venv/Scripts/python.exe -m pip install -r requirements-image.txt
#    체크포인트 두 개를 services/ai/models/ 에 둔다 (services/ai/README.md)
```

자세한 절차: [getting-started](docs/guidance/getting-started.md) · 환경변수: [environment](docs/guidance/environment.md) · 그림 엔진: [photonet-engine](docs/guidance/photonet-engine.md)

### 시험

```bash
npm run test:api             # API 단위·통합 232개, 파일 31개 (vitest, 실제 PostgreSQL)
npm run typecheck:api
npm run test:e2e             # 웹 화면 자동 테스트 123개 (운영 빌드, 가짜 LLM·가짜 그림 엔진). 개발 서버를 켜 둬도 된다
npm run test:e2e:adult-off   # 성인 모드를 끈 서버의 화면
(cd services/ai && ./.venv/Scripts/python.exe -m unittest discover tests)   # AI 규칙 71개 (모델 없음)
npm run ci:local             # GitHub Actions와 같은 단계를 깨끗한 클론에서
```

## 문서 지도

기획 원본의 문장과, 날짜가 붙은 실측·커밋 기록은 이 표에서 다시 쓰지 않습니다. 같은 값은 [docs/README.md](docs/README.md)의 문서 정본 표가 가리키는 곳에만 있습니다.

| 찾는 것 | 문서 |
|---------|------|
| 전체 문서 안내, 어떤 값을 어느 문서가 맡는지 | [docs/README.md](docs/README.md) |
| 일을 시작하는 순서 (브랜치, 커밋, 시험, 병합) | [CONTRIBUTING.md](CONTRIBUTING.md) |
| 지금 상태와 함정 | [AGENT_HANDOVER](docs/AGENT_HANDOVER.md) |
| 다음에 할 일 | [TASKS](docs/TASKS.md) |
| 소유자가 직접 할 일 | [owner-checklist](docs/guidance/owner-checklist.md) |
| 구현된 기능 전체 | [FEATURES](docs/FEATURES.md) |
| 그 기능 중 지금 열리는 범위 | [STATUS](docs/STATUS.md) |
| 월드코퍼챗 설계·쓰는 법·실측 | [WORLD_COPPERCHAT](docs/plan/WORLD_COPPERCHAT.md) · [world-copperchat](docs/guidance/world-copperchat.md) · [trainings](docs/trainings/world-copperchat.md) |
| README 그림과 영상, 다시 만드는 법 | [docs/.assets](docs/.assets/README.md) |
| 스택과 결정 | [CURRENT_STACK](docs/plan/CURRENT_STACK.md) |
| API | [API_DOCUMENTATION](docs/API_DOCUMENTATION.md) |
| 구조와 데이터 흐름 | [Architecture](docs/Architecture/overview.md) · [WORKFLOW](docs/WORKFLOW.md) |
| 실제로 돌려 본 결과 | [trainings](docs/trainings/README.md) |
| 배포 (지금 상태·절차) | [DEPLOYMENT](docs/DEPLOYMENT.md) · [oracle-backend](docs/web_management/oracle-backend.md) · [배포 기록 2026-11-07](docs/web_management/deploy-log-2026-11-07.md) |
| 보안과 공개 전 필수 | [SECURITY.md](SECURITY.md) |
| 라이선스와 제3자 고지 | [LICENSE](LICENSE) · [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) |
| 제품 기획 원본 | [CodiComperChat_project_plan.md](CodiComperChat_project_plan.md) |

## 작업 규칙

AI 에이전트를 포함해 이 저장소에서 일하는 모두가 따릅니다. 순서는 [CONTRIBUTING.md](CONTRIBUTING.md), 정본은 [.agents/skills/codicomperchat/SKILL.md](.agents/skills/codicomperchat/SKILL.md)입니다.

- 커밋: `type(scope):`는 영어, 요약·본문은 한국어 → [commit-message](docs/guidance/commit-message.md)
- 매 커밋마다 `docs/branchs/commits/`에 기록 → [TEMPLATE](docs/branchs/TEMPLATE.md)
- 작업은 `feature/*`에서, `develop`/`main` 병합은 `--no-ff`만 → [branch-merge](docs/guidance/branch-merge.md)
- 병합은 소유자가 말할 때만, 푸시는 요청할 때만. 함께 시키면 main 병합까지 끝낸 뒤 develop·main을 같이 푸시한다
- 범위를 임의로 넓히지 않는다. 기획 원본은 승인 없이 고치지 않는다
- 비밀값(`.env`, 키)과 모델 파일은 커밋하지 않는다 → [SECURITY.md](SECURITY.md)

---

© 2026 코디컴퍼챗 프로젝트. 모든 권리 보유. 화면의 그림과 대사는 AI가 만든 가상의 이야기입니다. 영상과 스크린샷을 만드는 도구: [scripts/readme-media](scripts/readme-media/README.md)
