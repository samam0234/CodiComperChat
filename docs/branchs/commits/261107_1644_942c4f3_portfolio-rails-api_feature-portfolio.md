# Rails 8 API 백엔드로 콘텐츠·시트·ERD·검색과 챗봇 프록시를 만든다

| 항목 | 내용 |
|------|------|
| Subject | `feat(portfolio): Rails 8 API 백엔드로 콘텐츠·시트·ERD·검색과 챗봇 프록시를 만든다` |
| Full SHA | `942c4f3f38816605a32263c5f68ef6e6c913011b` |
| Short SHA | `942c4f3` |
| Branch | `feature/portfolio` |
| Parent | `54d5bfd` |
| Date | 2026-11-07 16:44:54 +0900 |

## 주 내용

- `PortFolio/server/backend`: Rails 8.1 API 전용(Active Record 없음). 콘텐츠·페이지·시트·ERD·테이블 관계·검색 API, 챗봇 프록시, 상태 확인
- `PortfolioStore`(data/*.json 메모리), `AiClient`(내부 토큰, 240초, 시험용 끼움 자리), CORS(`FRONTEND_ORIGINS`), 챗봇 요청 한도(IP당 1분 6번)
- 통합 시험 9개(검증 40개), README, Dockerfile 사용법을 환경변수 방식으로

## 상세

**배경**
사용자가 포트폴리오 백엔드를 Ruby on Rails로, 챗봇 대화는 localStorage로(DB 없이) 요청했다(2026-11-07).

**변경 범위**
`PortFolio/server/backend/` 새 앱.

**기술 포인트**
- 서버는 대화를 저장하지 않고 요청마다 최근 12턴만 넘긴다(역할 user·assistant만).
- `rails new`가 만든 `config/master.key`·`credentials.yml.enc`는 지웠다. 운영 비밀은 `SECRET_KEY_BASE` 환경변수로.
- minitest 6에는 `stub`이 없어 `AiClient.override`를 시험용 끼움 자리로 두었다.
- 운영의 `force_ssl`은 `FORCE_SSL`로 끌 수 있고 `/up`·`/api/v1/health`는 리다이렉트하지 않는다.

**안 한 것**
DB, 사용자 인증(공개 포트폴리오).

## 결과

**동작 확인**
`bin/rails test` 9개 통과. 로컬에서 Rails(3011) → Flask(5011) → Ollama `gemma4:12b` 질문 한 번 20초, 근거 5개. 확인 뒤 제가 켠 두 서버를 껐다.

**리스크**
Git Bash `curl -d`로 한글을 보내면 CP949로 가서 400이 난다(서버 문제가 아님, README에 시험 방법).

**후속**
Astro 프론트, 배포 구성.
