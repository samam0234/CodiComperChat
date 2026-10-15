# 웹 화면 자동 테스트(Playwright e2e 21개)와 가짜 LLM 모드 추가

| 항목 | 내용 |
|------|------|
| Subject | `test(web): 웹 화면 자동 테스트(Playwright e2e 21개)와 가짜 LLM 모드 추가` |
| Full SHA | `7c53ceba2c314547fa81c059b0632395b5fffee2` |
| Short SHA | `7c53ceb` |
| Branch | `feature/web-e2e` |
| Parent | `213b6c7` (feature/quality-eval) |
| Date | 2026-10-15T12:34:37+09:00 |

## 주 내용

- `e2e/`: Playwright로 실제 Chrome 화면 흐름 21개 (`npm run test:e2e`)
- 별도 포트(web 3101·api 4101·ai 8101)·별도 DB(`codicomperchat_e2e`)·별도 빌드 폴더(`.next-e2e`)·가짜 LLM
- `services/ai`: `LLM_FAKE=1`이면 Ollama 대신 스키마에 맞는 고정 응답 (`fake_llm.py`)
- `e2e/prepare.mjs`: DB 생성·마이그레이션·전체 비우기·공식 캐릭터 심기·API 검증용 빌드
- e2e/README.md, TESTING.md

## 상세

**배경**
사용자 요청("웹 자동 테스트가 저장소에 없다"는 약점 개선). 지금까지 화면 검증은 제가 임시 스크립트로만 돌려 저장소에 남지 않았고, 이후 수정이 화면을 깨도 알아챌 방법이 없었다.

**변경 범위**
e2e(신규), services/ai(fake_llm, llm), apps/web(next.config), package.json(@playwright/test), .gitignore, docs/plan/TESTING.md

**기술 포인트**
- 개발 환경과 겹치지 않는 것이 핵심이다. 포트·DB·빌드 폴더·지식 파일 폴더를 모두 e2e 전용으로 나눠 개발 서버를 켜 둔 채로 돌려도 된다. Next가 `.next`와 `tsconfig.json`을 자동으로 고쳐 쓰는 문제는 `NEXT_DIST_DIR`와 e2e 전용 tsconfig(매번 생성, gitignore)로 피했다.
- DB 주소를 코드에 적지 않는다. `apps/api/.env`의 `DATABASE_URL`에서 데이터베이스 이름만 `codicomperchat_e2e`로 바꿔 쓴다.
- 가짜 LLM은 JSON 스키마의 속성 이름으로 고정값을 만들고 판정류는 "문제 없음"으로 나온다. 실제 품질 확인용이 아니고(그건 evals), 화면·서버 흐름이 결정적으로 돌게 하는 용도다.
- 준비(계정·초안·데이터)는 API로 직접 하고 화면에서 확인할 것만 브라우저로 해 빠르고 덜 깨진다. 한 번에 하나씩 돌고 테스트마다 새 계정을 만든다.
- 테스트를 만들며 앱 동작이 아니라 테스트 쪽 함정 4가지를 찾아 문서에 남겼다: 이메일 칸은 브라우저가 아이디 부분의 한글을 막는다(제출이 조용히 무시), 개발 서버 첫 로딩의 하이드레이션 지연, 서버 액션 직후 이동하면 요청이 끊김, 말풍선에 이름이 함께 들어 정확 일치가 안 됨.
- 의미 있는 테스트인지 확인하려고 비공개 캐릭터 규칙을 일부러 고장 내 보았고 관련 테스트 2개가 실패했다(되돌림).

**안 한 것**
CI 연동(배포 영역, 이번 범위 밖), 시각 회귀(스크린샷 비교), 접근성 자동 검사, services/ai pytest 단위 테스트

## 결과

**동작 확인**
- 전체 21개 통과 (약 1분): 계정 4, 대화 6, 공방 9, 신고 2
- 고장 낸 규칙에 대해 2개 실패 확인 후 복원
- 개발용 `.next`·`tsconfig.json`은 e2e를 돌려도 바뀌지 않음(작업 트리 확인)
- `LLM_FAKE` 없이도 evals 실행 정상 (tone 6/6)

**리스크**
e2e DB가 개발 DB와 같은 PostgreSQL 서버를 쓴다(이름만 다름). 비워지는 것은 e2e DB뿐이다. 첫 실행은 Next 개발 서버 컴파일 때문에 몇 분 걸릴 수 있다. 시스템에 Chrome이 설치돼 있어야 한다.

**후속**
CI에서 e2e 실행(배포 작업 때), 접근성·시각 회귀

**관련 문서**
[e2e/README.md](../../../e2e/README.md), [docs/plan/TESTING.md](../../plan/TESTING.md)
