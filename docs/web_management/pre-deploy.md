# 배포 전 체크

체크 표시는 2026-11-03 기준이다.

**구성**
- [x] 인증 방식 — 자체 이메일·비밀번호 + 이메일 인증
- [x] 운영 구성(web·console·api·ai·ollama·postgres·caddy)이 실제로 뜨는지 — [docker-deploy.md](docker-deploy.md) "확인"
- [x] 백업·복구 연습 — [backup-restore.md](backup-restore.md)
- [x] 운영 의존성 취약점 점검 — `npm audit --omit=dev` 0건, Python은 [../../SECURITY.md](../../SECURITY.md)
- [ ] CI 통과 (GitHub Actions 또는 `npm run ci:local`)

**사람이 정하거나 넣어야 할 것**
- [x] 호스팅 업체 선택: Hetzner GEX45 ([hosting-options.md](hosting-options.md))
- [ ] 서버 계약과 생성 (조건: [docker-deploy.md](docker-deploy.md))
- [ ] 도메인과 DNS
- [ ] `deploy/.env` 값 (DB, `AUTH_SECRET`, `AI_SERVICE_TOKEN`, SMTP) — 저장소에 커밋하지 않는다
- [ ] 운영 SMTP. `npm run mail:check --workspace api -- 주소` 통과
- [ ] 체크포인트 파일 반입, 첫 실행 때 인터넷(Hugging Face 구성 파일) 확인
- [ ] `CONSOLE_IP_ALLOWLIST` 운영 값
- [ ] 약관·개인정보처리방침의 `[운영자 기재]` 칸 + 법률 검토
- [ ] 토스 키, `npm run billing:check --workspace api` (결제를 다시 열 때만)

**공개 전 확인**
- [ ] [../../SECURITY.md](../../SECURITY.md) "공개 전 필수" 전부
- [ ] [../../THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md): 성인 모드의 국내법·호스팅 약관, RAIL 사용 제한
- [ ] 프리미엄을 켠다면: 공급자 콘솔의 월 한도, `python -m evals.premium_check`로 실제 호출, 처리방침의 국외 이전 항목
- [ ] 저장소 비공개 전환, 서버 배포 키 등록 ([docker-deploy.md](docker-deploy.md) "배포 키")
- [ ] GitHub 설정: 브랜치 보호, 비밀 스캔. 비공개 저장소에서는 요금제에 따라 제한될 수 있다(미확인)
- [ ] 정식 서비스로 바꿀 때: `PRO_CLICK=off`, 토스 결제, 프로 안내 문구
- [ ] [../vaildates/mvp-checklist.md](../vaildates/mvp-checklist.md) 통과
