# Oracle VM에 CPU AI 서버를 더하는 구성과 안내

| 항목 | 내용 |
|------|------|
| Subject | `feat(deploy): Oracle VM에 CPU AI 서버를 더하는 구성과 안내` |
| Full SHA | `5b59b63f7426fa085c8c3f359f19a29cb665b683` |
| Short SHA | `5b59b63` |
| Branch | `claude/project-thread-pz0x5f` |
| Parent | `97a8fae` |
| Date | 2026-11-06 22:49:25 +0000 |

## 주 내용

- 이미 띄운 Oracle 백엔드 구성에 덧붙이는 `deploy/oracle/docker-compose.ai.yml`(ai·ollama) 추가
- ARM·CPU용 `deploy/oracle/ai-cpu.Dockerfile`(requirements.txt만 설치) 추가
- `.env.example`에 `AI_CONCURRENCY=1`, `OLLAMA_MODEL` 추가
- `docs/web_management/ai-server-guide.html` 단계별 안내 추가, `oracle-backend.md`에서 연결

## 상세

**배경**
사용자가 Oracle 백엔드 배포를 마치고 AI 서버 배포 안내를 요청했다(2026-11-07).

**변경 범위**
deploy/oracle, docs/web_management. 앱 코드는 건드리지 않았다.

**기술 포인트**
main의 `llm.py`는 Ollama만 부르므로 같은 VM에 CPU Ollama를 올리는 길을 택했다. api는 기본값 `AI_BASE_URL=http://ai:8000`을 이미 가져 바꿀 것이 없다. CPU라 `OLLAMA_KEEP_ALIVE=-1`, `OLLAMA_NUM_PARALLEL=1`, `AI_CONCURRENCY=1`.

**안 한 것**
무료 호스팅 API 연동(PR #2)과 타임아웃 코드 변경은 하지 않았다. 그림 기능은 잠긴 채로 둔다.

## 결과

**동작 확인**
`docker compose config`로 두 파일 병합 확인. torch 없이 requirements.txt만 설치한 venv에서 APP_ENV=production으로 기동, `/health` 200, 토큰 없는 `/infer` 401.

**리스크**
ARM CPU 속도는 재지 않았다. 120초(AI→Ollama)·130초(API→AI) 제한에 긴 답이 걸릴 수 있다. 실제 VM에서 빌드하지 않았다.

**후속**
VM에서 `eval rate`를 재고, 느리면 PR #2 병합 또는 GPU 서버를 검토한다.

**관련 문서**
docs/web_management/ai-server-guide.html · docs/web_management/oracle-backend.md
