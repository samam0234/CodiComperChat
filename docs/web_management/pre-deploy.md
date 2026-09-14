# 배포 전 체크 (TBD)

> 배포 대상이 아직 정해지지 않았다 (계획서 §15 "아직 열려 있는 것": 인증 벤더, 호스티드 LLM 벤더, 실제 배포처). 아래는 확정 전까지의 준비 체크리스트다.

- [ ] 인증 벤더 확정
- [ ] 호스티드 LLM 벤더 확정
- [ ] `.env` 시크릿 값 준비 (DB, Redis, LLM API 키) — 저장소에 커밋하지 않는다
- [ ] `docker-compose.yml` 존재 및 로컬에서 5개 서비스 정상 기동 확인
- [ ] [../vaildates/mvp-checklist.md](../vaildates/mvp-checklist.md) 통과
