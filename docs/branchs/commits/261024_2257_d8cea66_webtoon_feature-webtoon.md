# 웹툰 — 대화를 여러 컷 웹툰으로 (콘티 무료, 한 컷 45 코레딧)

| 항목 | 내용 |
|------|------|
| Subject | `feat(ops): 웹툰 — 대화를 여러 컷 웹툰으로 (콘티 무료, 한 컷 45 코레딧)` |
| Full SHA | `d8cea66894485803658a61f59ba722786d63af40` |
| Short SHA | `d8cea66` |
| Branch | `feature/webtoon` |
| Parent | `c0f47d8` (feature/adult-guard) |
| Date | 2026-10-24T22:57:12+09:00 |

## 주 내용

- 오퍼레이션 메뉴에 웹툰(/characters/:id/chat/webtoon): 장면 설명(비우면 최근 대화)·컷 수 2~6·수위를 고르고 "웹툰 만들기" → 콘티(무료)를 짜고 1컷부터 차례로 그림(한 컷 45 코레딧)
- 콘티 두 단계: 1) 등장인물 외모를 한 번 정함(영어 태그, 서로 분명히 다르게, 성인) 2) 컷마다 이름·표정·자세·구도·장소·행동·빛, 한국어 해설·대사(대화에서 가져오고 말투 유지, 주인공은 유저가 실제로 한 말만). 외모는 코드가 이름으로 끼워 넣어 모든 컷에서 같은 사람이 같게, 명단에 없는 사람은 뺌
- 컷은 코디포토넷 조립·엔진·검수를 그대로 사용, 웹툰 화풍·가로. 실패하면 환불, 비어 있는 컷은 "이 컷 그리기"/"남은 N컷 이어 그리기"로 이어 그림. 이미 그린 컷 409
- 해설은 네모 상자, 대사는 말풍선으로 그림 아래 글자로(그림 모델은 한글을 못 씀). 성인 웹툰은 코디포토넷과 같은 가드(성인 확인 403, 미성년자 설정 400 — 콘티의 해설·대사까지 검사, 동의 철회 시 404)
- DB: webtoons, webtoon_panels(마이그레이션 20261024200000_webtoon, 개발 DB에 적용). 요청 한도 webtoonPlan 10분 6번, webtoonPanel 10분 14번. .gitignore에 services/ai/models/ (이 브랜치에도)

## 상세

**배경**
사용자 요청("오퍼레이션 기능에서 웹툰 만들기 기능도 만들어 줬으면 해 (한 컷 마다 45코레딧)"). 성인 모드 가드를 그대로 쓰려고 feature/adult-guard 위에 쌓았다.

**변경 범위**
apps/api(operations: webtoon.service·controller, credits, rate-limit, prisma), services/ai(webtoon 신규, photonet.story_parts 분리, fake_llm), apps/web(웹툰 화면·중계 라우트·actions·메뉴), e2e/tests/webtoon.spec.ts, docs, .gitignore

**기술 포인트**
- 한 번에 다 그리지 않고 컷마다 요청: 한 컷 40초~3분이라 묶으면 시간 제한을 넘고 중간 실패 시 처음부터 다시 해야 한다. 같은 컷 동시 그리기는 프로세스 안 잠금으로 이중 차감 방지
- 실제 gemma 실측(콘티만): 한 번에 쓰게 하니 태그를 한국어로 쓰고, 외모 없는 사람에게 남의 외모를 주고, unknown 사람을 만듦 → 외모 단계를 분리하고 이름을 enum으로 묶음 → 4컷 약 25초·6컷 약 19초, 외모가 영어·서로 다르게·모든 컷에서 같게, 구도 변화, 대사는 실제 대화에서
- 커밋 중 사고: 이 브랜치는 그림 엔진 브랜치에서 갈라지지 않아 .gitignore에 services/ai/models/가 없었고 git add가 모델 파일을 올리기 시작함 → 멈추고, 참조되지 않는 큰 객체 2개(Animagine 조각 2.6GB, 임시 파일)와 index.lock만 지움(전체 prune은 하지 않음), 이 브랜치 .gitignore에도 추가. git fsck 정상

**안 한 것**
실제 엔진으로 컷 그림을 그려 보지는 않음(코디포토넷과 같은 경로). 고른 대사로 웹툰 만들기는 API만 있고 화면에는 없음. 컷 사이 얼굴 일관성은 외모 태그로만 맞춤

## 결과

**동작 확인**
- e2e webtoon 4개 + operations 18개 통과
- 실제 gemma 콘티 4·6컷 확인
- 타입 검사 api·web, AI import

**리스크**
없음

**후속**
develop 병합(사용자 확인 후) — adult-guard 다음에

**관련 문서**
docs/plan/OPERATIONS.md, API_DOCUMENTATION.md, DATABASE.md, NAVIGATION_IA.md
