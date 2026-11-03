# 배포 후 확인

아직 실제 배포 전이다. 처음 올린 뒤 위에서부터 확인한다.

**연결**
- [ ] `docker compose ... ps`: 상시 서비스 모두 running/healthy, `migrate`는 `Exited (0)`
- [ ] 바깥에서 `http://도메인` → https 308, 인증서 정상, HSTS 헤더 있음
- [ ] 바깥에서 4000·8000·5432·11434 포트가 닫혀 있음
- [ ] 콘솔 도메인: 허용 IP에서만 열림

**기능**
- [ ] 가입 → 인증 메일 수신 → 로그인
- [ ] 홈에 유지성·이세연과 초상이 보임
- [ ] 프로필 선택 → 대화 한 턴, 답이 옴
- [ ] 대화 3번 뒤 "지난 이야기"가 갱신됨
- [ ] `/photonet/status`가 ready, 코디포토넷 한 장 + 웹툰 한 컷, 코레딧이 빠지고 실패하면 돌아옴
- [ ] 콘솔에서 신고·초상·그림 신고 화면이 열림
- [ ] `/pricing`의 "프로로 바꾸기"로 프로가 되고 출석이 5,000이 됨 (`PRO_CLICK`)
- [ ] 설정에서 나이 확인을 입력할 수 있고, 프리미엄은 키가 없으면 "준비 중"
- [ ] 성인 그림과 성인 확인이 막혀 있음 (`ADULT_MODE=off`)

**운영**
- [ ] `docker compose ... exec ai python -c "import torch; print(torch.cuda.is_available())"` True
- [ ] 서버 재부팅 뒤 전부 자동 복귀
- [ ] `scripts/db-backup.sh` 실행, cron 등록, 새 DB에 복구 연습
- [ ] [../vaildates/mvp-checklist.md](../vaildates/mvp-checklist.md) 재확인
- [ ] 새로 발견된 이슈는 [../find_debug/](../find_debug/)에 당일 일지로 기록
