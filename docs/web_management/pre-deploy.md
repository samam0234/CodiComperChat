# 배포 전 체크

체크 표시는 2026-11-03 기준이다.

**구성**
- [x] 인증 방식 — 자체 이메일·비밀번호 + 이메일 인증
- [x] 운영 구성(web·console·api·ai·ollama·postgres·caddy)이 실제로 뜨는지 — [docker-deploy.md](docker-deploy.md) "확인"
- [x] 백업·복구 연습 — [backup-restore.md](backup-restore.md)
- [x] 운영 의존성 취약점 점검 — `npm audit --omit=dev` 0건, Python은 [../../SECURITY.md](../../SECURITY.md)
- [ ] CI 통과 (GitHub Actions 또는 `npm run ci:local`)

**사람이 정하거나 넣어야 할 것**
- [ ] 호스팅 업체 선택, GPU 서버 생성 (조건: [docker-deploy.md](docker-deploy.md))
- [ ] 도메인과 DNS
- [ ] `deploy/.env` 값 (DB, `AUTH_SECRET`, `AI_SERVICE_TOKEN`, SMTP) — 저장소에 커밋하지 않는다
- [ ] 운영 SMTP. `npm run mail:check --workspace api -- 주소` 통과
- [ ] 체크포인트 파일 반입, 첫 실행 때 인터넷(Hugging Face 구성 파일) 확인
- [ ] `CONSOLE_IP_ALLOWLIST` 운영 값
- [ ] 저장소 [../../LICENSE](../../LICENSE)의 권리자 법적 이름
- [ ] 약관·개인정보처리방침의 `[운영자 기재]` 칸 + 법률 검토
- [ ] 토스 키, `npm run billing:check --workspace api` (결제를 다시 열 때만)

**공개 전 확인**
- [ ] [../../SECURITY.md](../../SECURITY.md) "공개 전 필수" 전부
- [ ] [../../THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md): 특히 Gemma 사용 금지 정책(성인 모드)과 RAIL 사용 제한
- [ ] 저장소 공개 범위 결정: 공개 저장소는 clone을 기술적으로 막을 수 없다. 막으려면 비공개로 돌리고 배포 키를 쓴다
- [ ] GitHub 설정: 비공개 보안 권고, 브랜치 보호, 비밀 스캔
- [ ] [../vaildates/mvp-checklist.md](../vaildates/mvp-checklist.md) 통과
