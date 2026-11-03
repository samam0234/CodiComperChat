# 작업 지시서

Cursor 같은 에이전트가 이 문서만 보고 다음 일을 고르고 끝낼 수 있게 쓴 목록이다. 기준 시점 2026-11-03, 기준 브랜치 `feature/docs-handoff`.

규칙은 [SKILL.md](../.agents/skills/codicomperchat/SKILL.md), 지금 상태와 함정은 [AGENT_HANDOVER.md](AGENT_HANDOVER.md)에 있다. 일을 시작하기 전에 둘 다 읽는다. 이전 대화 내용은 어느 에이전트도 볼 수 없으므로, 합의한 내용은 모두 이 저장소의 문서에 있다고 본다.

## 쓰는 법

1. 위에서부터 **막히지 않은** 작업 하나를 고른다. 한 번에 하나씩 한다.
2. "선행"이 안 끝났으면 건너뛴다. 사용자 몫(`U`)은 대신 하지 않고 필요하다고 알린다.
3. "방향 확인"이 붙은 작업은 만들기 전에 사용자에게 방향을 묻는다.
4. 작업별 `feature/*` 브랜치에서 하고, 커밋마다 기록을 남긴다. 병합과 푸시는 사용자가 말할 때만 한다.
5. 끝나면 이 문서에서 그 줄을 지우거나 상태를 고치고, 바뀐 기능·수치는 [문서 정본 표](README.md#문서-정본-표)대로 고친다.
6. "끝난 기준"을 실제로 돌려 본 결과를 보고한다. 못 돌린 것은 못 돌렸다고 적는다.

시작할 때 쓰는 문구:

```text
docs/AGENT_HANDOVER.md와 docs/TASKS.md를 읽고, 막히지 않은 첫 작업을 진행해.
시작 전에 고른 작업과 선행 조건 확인 결과를 알려 줘. 병합과 푸시는 내가 말할 때만 해.
```

## 1. 병합까지 (지금 할 일)

### T01. 전체 e2e 다시 돌리기

- **선행:** U01(개발 서버 끄기). 아래 명령으로 먼저 확인한다. 3000·4000·8000 중 하나라도 켜져 있으면 **멈추고 사용자에게 알린다.** 직접 끄지 않는다.
- **왜:** 개발 서버를 켠 실행은 108/112, 끈 실행(2026-11-03)은 111/112였다. 끝난 기준(112)은 아직이다. 경과: [find_debug/2026-11-03.md](find_debug/2026-11-03.md).
- **할 일:**

  ```powershell
  3000,4000,8000 | % { "$_ : " + [bool](Get-NetTCPConnection -LocalPort $_ -State Listen -ErrorAction SilentlyContinue) }
  (Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory / 1024   # 남은 RAM(MB)
  ```

  ```bash
  npm run test:e2e > e2e/.tmp/full.log 2>&1; echo "exit $?"
  ```

  `npx playwright test`를 직접 쓰지 않는다(준비 단계가 빠진다). 로그의 실패 표시는 `x`다.
- **끝난 기준:** 112개 전부 통과, 종료 코드 0. 그 결과를 [AGENT_HANDOVER.md](AGENT_HANDOVER.md) 1장과 [plan/TESTING.md](plan/TESTING.md)에 적는다.
- **하지 말 것:** 시간 제한 늘리기, `test.skip`, 재시도 횟수 늘리기.
- **실패하면:** 같은 시험이면 T02로, 매번 다른 시험이면 실패 목록과 RAM을 사용자에게 보고한다.

### T02. `chat.spec.ts:31` 원인 찾기

- **선행:** T01에서 이 시험이 또 실패했을 때만. 2026-11-03에 서버를 끈 전체 실행에서는 통과했다. 다시 실패하기 전에는 열지 않는다.
- **왜:** 개발 서버를 켠 전체 실행 3번은 실패했고, 서버를 끈 전체 실행에서는 7.3초에 통과했다. 코드 결함이 아니라 메모리 부족으로 본다. 경과: [find_debug/2026-11-03.md](find_debug/2026-11-03.md).
- **보는 곳:** `e2e/tests/chat.spec.ts`의 `say` 도우미, `apps/web/app/api/characters/[id]/chat/route.ts:11`(`await request.json()`), `apps/web/app/characters/[id]/chat/character-chat.tsx`.
- **단서:** 웹 로그의 `Unexpected end of JSON input`이 시험이 끝난 뒤에 찍혔다. 요청이 처리되기 전에 시험이 끝났다는 가설이며, 증명되지 않았다. 코드 문제일 가능성을 먼저 배제한다. e2e 웹 서버는 `next dev`라 첫 컴파일이 느리다.
- **끝난 기준:** 원인을 재현 명령과 함께 [find_debug/2026-11-03.md](find_debug/2026-11-03.md)에 적고, 코드 결함이면 고친 뒤 `npm run test:e2e -- tests/chat.spec.ts --repeat-each=3`와 전체 e2e가 통과한다.
- **하지 말 것:** T01과 같다.

### T03. `develop`에 병합

- **선행:** T01 통과, 사용자가 "병합"이라고 말함.
- **할 일:** 아래 순서대로 하나씩 `git merge --no-ff`하고, 병합마다 기록을 남긴다. 절차는 [guidance/branch-merge.md](guidance/branch-merge.md).

  ```text
  feature/premium-adapters → feature/docs-model-license → feature/deploy-server-setup
  → feature/adult-mode-switch → feature/pro-click → feature/premium-age-gate
  → feature/private-repo-decisions → feature/docs-handoff
  ```

- **끝난 기준:** 병합 뒤 `npm run typecheck:api`, `npm run test:api`, `npm run test:e2e` 통과를 보고한다. 푸시는 따로 요청받았을 때만 한다.

## 2. 사용자만 할 수 있는 일

에이전트는 대신 하지 않는다. 막히면 어떤 일이 필요한지 알린다.

| ID | 할 일 | 막고 있는 것 |
|----|-------|--------------|
| U01 | 개발 서버(3000·4000·8000) 끄기, 그림 엔진(WebUI) 끄기, Chrome 창 줄이기 | T01 |
| U02 | 저장소 비공개 전환: GitHub Settings → Danger Zone → Change visibility. 공개였던 동안 받아 간 사본은 되돌릴 수 없다 | T04 |
| U03 | `gh auth login` | T05 |
| U04 | Hetzner GEX45 계약. 계약 전에 값과 약관을 다시 확인한다 ([hosting-options.md](web_management/hosting-options.md)) | T06 |
| U05 | 도메인 구매, 운영 메일(SMTP) 서비스 선택 | T06 |
| U06 | 약관·처리방침의 `[운영자 기재]` 기입과 법률 검토 | 공개 |
| U07 | `LICENSE` 권리자 줄을 어떻게 할지 결정(T04 참고) | T04 |

## 3. 사용자 일이 끝난 뒤

### T04. `LICENSE` 문구 정리

- **선행:** U02, U07.
- **할 일:** 1항 "공개되어 있어도 허락이 아닙니다"와 "누구나 GitHub에서 이 저장소를 볼 수 있고" 부분을 비공개 저장소에 맞게 고친다. 법적 문서이므로 고칠 문안을 먼저 보여 주고 승인을 받는다.
- **열린 문제:** 파일 끝의 안내가 "공개 출시 전에 권리자 줄을 법적 이름으로 바꾼다"고 한다. 2026-11-03 결정은 "공개 저장소에 이름을 적지 않는다"였다. 비공개가 되면 적어도 되는지 사용자에게 묻는다.
- **끝난 기준:** 승인한 문안 반영, [../README.md](../README.md)와 [SECURITY.md](../SECURITY.md)의 관련 문구 일치.

### T05. GitHub 설정 확인

- **선행:** U02, U03.
- **할 일:** 브랜치 보호(`main`·`develop`)와 비밀 스캔이 지금 요금제의 비공개 저장소에서 되는지 읽어 본다. 설정을 바꾸는 것은 사용자 승인 뒤에 한다.
- **끝난 기준:** 되는 것·안 되는 것을 [SECURITY.md](../SECURITY.md) "공개 전 필수"와 [web_management/pre-deploy.md](web_management/pre-deploy.md)에 적는다.

### T06. 실서버 설치와 확인

- **선행:** U04, U05, T03.
- **할 일:** [web_management/docker-deploy.md](web_management/docker-deploy.md) 순서대로 진행한다. 배포 키, `deploy/server-setup.sh`, 운영 모드의 `PRO_CLICK`은 **실서버에서 돌려 본 적이 없다.**
- **끝난 기준:** [web_management/post-deploy.md](web_management/post-deploy.md) 전체 확인, 재부팅 복귀, 백업 복구 연습.

## 4. 결정 없이 할 수 있는 개선

대략 위쪽이 먼저다. 모두 T03 뒤에 `develop`에서 새 브랜치를 따서 한다.

| ID | 할 일 | 끝난 기준 |
|----|-------|-----------|
| Q01 | CI에 `services/ai` unittest와 기록 작성기 시험을 넣는다. 지금은 둘 다 CI에 없다. `.github/workflows/ci.yml`과 `scripts/ci-local.mjs`를 함께 고친다 | `npm run ci:local -- checks` 통과 |
| Q02 | 전체 린트를 다시 돌린다. 프리미엄 나이·클릭 프로 작업 뒤 돌리지 않았다. 명령은 [AGENT_HANDOVER.md](AGENT_HANDOVER.md) 5장 | 경고 0건, 나오면 고친다 |
| Q03 | `ADULT_MODE=off`일 때 설정·코디포토넷·웹툰의 성인 확인 입구를 숨긴다. 지금은 보이지만 서버가 막는다 | 끈 상태의 e2e 또는 단위 시험 추가 |
| Q04 | 그림 신고를 브라우저로 시험한다. 지금은 단위 시험만 있다 | e2e 추가, [FEATURES.md](FEATURES.md) 13장 비고 고침 |
| Q05 | `evals`에 편입: 유지성 퀘스트, 나레이션 `@:`, 성인 그림 가드, 웹툰 콘티 | 실제 gemma로 돌린 결과를 [plan/TESTING.md](plan/TESTING.md)에 적음 |
| Q06 | SDXL 한 장 약 54~93초의 원인을 재고 줄인다. 그림 뒤 검수 gemma와 그래픽 메모리를 번갈아 쓰는 탓으로 보이나 재지 않았다 | 단계별 시간과 전후 비교를 [guidance/photonet-engine.md](guidance/photonet-engine.md)에 적음 |
| Q07 | 이세연 페르소나 지식 JSON 추가, 보상 장면 안정화(4번 중 2번만 지시대로 나왔다) | `python -m evals.quest_seyeon` 통과, 실제 대화 확인 |
| Q08 | 웹툰 컷 사이 얼굴 일관성 | 같은 콘티의 컷을 눈으로 비교한 결과를 [plan/OPERATIONS.md](plan/OPERATIONS.md)에 적음 |

## 5. 방향 확인이 필요한 일

만들기 전에 사용자에게 묻는다.

| ID | 할 일 | 물어볼 것 |
|----|-------|-----------|
| D01 | 서비스 전체 지출 한도(프리미엄을 열기 전 필수) | 월 한도 값, 넘었을 때 동작 |
| D02 | 프리미엄 키를 넣고 실제 호출 확인 | 언제 열지, 어느 공급자부터. 돈이 나가는 일이다 |
| D03 | 생년월일 정정 수단(지금은 운영자가 DB를 직접 고친다) | 콘솔 기능으로 만들지, 증빙을 받을지 |
| D04 | 공방 AI 초상 미리보기·여러 장 뽑기, 유저 캐릭터의 추천 프로필 칸 | 코레딧을 언제 뺄지 |
| D05 | 스트리밍 응답 | 개인사 가드가 답 전체를 본 뒤 다시 쓰는 구조와 어떻게 맞출지 |
| D06 | 캐릭터당 퀘스트 여러 개, 여러 번의 정리에 걸친 달성 | 판정 비용과 보상 규칙 |
| D07 | 성인 모드 공개 | 법률 검토 뒤. 호스팅 약관이 걸린다 ([THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md)) |
| D08 | 정식 서비스 전환: `PRO_CLICK=off`, 토스 결제, 프로 안내 문구, 가격 확정 | 시기와 가격 |
| D09 | 병합 끝난 로컬 브랜치 정리(100개 넘음) | 지워도 되는지 |
| D10 | `main` 병합 방식. 규칙은 `release/*` 검증 후 병합이지만, 지금까지는 `develop`을 직접 병합했다 | 어느 쪽으로 할지 |
