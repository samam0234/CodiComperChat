# 포트폴리오 챗봇 서버를 Oracle 서버에 얹는 구성 추가

| 항목 | 내용 |
|------|------|
| Subject | `feat(deploy): 포트폴리오 챗봇 서버를 Oracle 서버에 얹는 구성 추가` |
| Full SHA | `decfa6f63c885d24a6be3b8dd73cfc2359aff01a` |
| Short SHA | `decfa6f` |
| Branch | `feature/portfolio-oracle` |
| Parent | `27972e5` |
| Date | 2026-11-08 16:34:34 +0900 |

## 주 내용

- 포트폴리오 챗봇 서버(Rails `pf-backend` + Flask `pf-ai`)를 기존 Oracle 서버에 얹는 compose 덧붙임 `PortFolio/server/docker-compose.oracle.yml` 추가. 제품 망에 external로 붙고 제품 Ollama(`gemma4:e4b`)를 나눠 쓴다. 메모리 상한 400MB/800MB.
- 제품 Caddy에 `PORTFOLIO_API_DOMAIN` 사이트 블록 추가(비면 localhost라 바깥에 안 열림).
- 실서버 배포: `/api/v1/health` 200, 챗 질문 약 50초 200·CORS 통과. Vercel `PUBLIC_API_BASE` 설정 후 포트폴리오 사이트 재배포.
- 문서(oracle-backend·PortFolio README·STATUS)를 "챗봇 서버 없음"에서 현재 상태로 고침.

## 주의

- Ollama 한 요청씩 처리: 제품 대화와 겹치면 챗봇이 180초 제한에 걸려 503 가능.
- 비밀값은 서버 `.env`에만 있고 커밋되지 않았다.
