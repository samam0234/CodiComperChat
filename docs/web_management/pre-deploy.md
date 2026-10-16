# 배포 전 체크 (TBD)

> 배포 대상이 아직 정해지지 않았다 (계획서 §15 "아직 열려 있는 것": 인증 벤더, 호스티드 LLM 벤더, 실제 배포처). 아래는 확정 전까지의 준비 체크리스트다.

- [x] 인증 방식 확정 — 자체 이메일·비밀번호 + 이메일 인증
- [ ] 호스티드 LLM 벤더 확정 (개발은 로컬 Ollama)
- [ ] `.env` 시크릿 값 준비 (DB, `AUTH_SECRET`, SMTP, 토스 키) — 저장소에 커밋하지 않는다 · 전체 표 [../guidance/environment.md](../guidance/environment.md)
- [ ] `npm run billing:check --workspace api`·`npm run mail:check --workspace api -- 주소` 통과
- [ ] [../DEPLOYMENT.md](../DEPLOYMENT.md) "배포 때 꼭 할 것" 표 확인
- [ ] 약관·개인정보처리방침의 `[운영자 기재]` 칸 채우기 + 법률 검토
- [ ] CI 통과 (GitHub Actions 또는 `npm run ci:local`)
- [ ] `docker-compose.yml` 존재 및 로컬에서 5개 서비스 정상 기동 확인
- [ ] [../vaildates/mvp-checklist.md](../vaildates/mvp-checklist.md) 통과
