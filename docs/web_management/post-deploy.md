# 배포 후 확인

처음 올린 뒤 위에서부터 확인한다. **2026-11-07 Oracle 서버(API·DB·AI) + Vercel 웹에서 확인한 결과를 체크로 남겼다.** GPU·콘솔·메일이 필요한 항목은 그 서버에서 할 수 없어 비워 두었다. 지금 서버의 점검 명령: [oracle-backend.md](oracle-backend.md).

**연결**
- [x] `docker compose ... ps`: 상시 서비스 모두 running/healthy, `migrate`는 `Exited (0)` (2026-11-07, compose 두 파일)
- [x] 바깥에서 `http://도메인` → https 308, 인증서 정상, HSTS 헤더 있음 (2026-11-07, `api.168-110-61-178.sslip.io`, `max-age=15552000; includeSubDomains`)
- [x] 바깥에서 4000·8000·5432·11434 포트가 닫혀 있음 (2026-11-07. 열린 것은 22·80·443뿐)
- [ ] 콘솔 도메인: 허용 IP에서만 열림 (2026-11-07 기준 콘솔은 API에 연결 안 함, 허용 IP 결정 대기)

**기능**
- [ ] 가입 → 인증 메일 수신 → 로그인
- [x] 홈에 유지성·이세연과 초상이 보임 (2026-11-07, Vercel 웹 HTML에 두 캐릭터 렌더링. 초상은 눈으로 보지 않았다)
- [ ] 프로필 선택 → 대화 한 턴, 답이 옴
- [ ] 대화 3번 뒤 "지난 이야기"가 갱신됨
- [ ] `/photonet/status`가 ready, 코디포토넷 한 장 + 웹툰 한 컷, 코레딧이 빠지고 실패하면 돌아옴
- [ ] 콘솔에서 신고·초상·그림 신고 화면이 열림
- [ ] `/pricing`의 "프로로 바꾸기"로 프로가 되고 출석이 5,000이 됨 (`PRO_CLICK`)
- [ ] 설정에서 나이 확인을 입력할 수 있고, 프리미엄은 키가 없으면 "준비 중"
- [ ] 성인 그림과 성인 확인이 막혀 있음 (`ADULT_MODE=off`)

**운영**
- [ ] `docker compose ... exec ai python -c "import torch; print(torch.cuda.is_available())"` True (GPU 서버에서만. Oracle은 CPU라 해당 없음)
- [ ] 서버 재부팅 뒤 전부 자동 복귀
- [ ] `scripts/db-backup.sh` 실행, cron 등록, 새 DB에 복구 연습
- [ ] [../vaildates/mvp-checklist.md](../vaildates/mvp-checklist.md) 재확인
- [ ] 새로 발견된 이슈는 [../find_debug/](../find_debug/)에 당일 일지로 기록

<!-- logic-structure -->
## 로직 구조

```text
올림 ─▶ /health (api·ai) ─▶ 가입·메일 ─▶ 대화 한 턴 ─▶ 그림 ─▶ 콘솔 ─▶ 월드 ─▶ 백업 한 번 ─▶ 재부팅 복귀
```

<!-- logic-mermaid -->

### 올린 뒤 확인

```mermaid
flowchart LR
  H["health"] --> S["가입 · 메일"] --> C["대화"] --> I["그림"] --> CO["콘솔"] --> W["월드"] --> B["백업"] --> R["재부팅 복귀"]
```

## 월드코퍼챗 확인 (2026-11-06)

- [ ] `/worlds`가 열리고 공개 목록이 보인다
- [ ] 시험 계정으로 세계관을 만들어 비공개로 발행 → 시작 → 한 턴 → 답
- [ ] 장면 그림 하나 올리기 → 자동 검수 결과(통과 또는 대기)
- [ ] 콘솔 `/worlds`, `/worlds/settings`가 열리고 값이 기본값
- [ ] `select count(*) from world_events where rewarded;`가 이상하게 늘지 않는다(보상 한도)
