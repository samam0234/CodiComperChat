# 배포 전 체크 (TBD)

> 배포 대상이 아직 정해지지 않았다 (계획서 §15 "아직 열려 있는 것": 인증 벤더, 호스티드 LLM 벤더, 실제 배포처). 아래는 확정 전까지의 준비 체크리스트다.

- [x] 인증 방식 확정 — 자체 이메일·비밀번호 + 이메일 인증
- [ ] 호스티드 LLM 벤더 확정 (개발은 로컬 Ollama)
- [ ] `.env` 시크릿 값 준비 (DB, `AUTH_SECRET`, SMTP, 토스 키) — 저장소에 커밋하지 않는다 · 전체 표 [../guidance/environment.md](../guidance/environment.md)
- [ ] `npm run billing:check --workspace api`·`npm run mail:check --workspace api -- 주소` 통과
- [ ] [../DEPLOYMENT.md](../DEPLOYMENT.md) "배포 때 꼭 할 것" 표 확인
- [ ] **[../../SECURITY.md](../../SECURITY.md) "공개 전 필수" 체크리스트 전부** (FastAPI 외부 차단·HSTS·콘솔 비공개·비밀값·개발용 스위치 등)
- [ ] **모델·소프트웨어 라이선스** [../../THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md): 특히 Gemma 사용 금지 정책(성인 모드)과 RAIL 사용 제한 — 확인 전에는 성인 모드를 공개하지 않는다
- [ ] 저장소 [../../LICENSE](../../LICENSE)의 권리자 법적 이름 채우기
- [ ] 그림 엔진을 돌릴 GPU 서버 결정, 체크포인트 파일 반입, 첫 실행 때 인터넷(Hugging Face 구성 파일) 확인
- [ ] 성인 모드: 본인인증 도입 여부(법률 검토)와 성인 콘텐츠 신고·검토 운영 체계
- [ ] 약관·개인정보처리방침의 `[운영자 기재]` 칸 채우기 + 법률 검토
- [ ] CI 통과 (GitHub Actions 또는 `npm run ci:local`)
- [ ] `docker-compose.yml` 존재 및 배포 구성(web·console·api·ai·postgres) 정상 기동 확인
- [ ] [../vaildates/mvp-checklist.md](../vaildates/mvp-checklist.md) 통과
