# 페르소나 지식 JSON 형식·검증기·저장소와 시작 파일 생성기 추가

| 항목 | 내용 |
|------|------|
| Subject | `feat(api): 페르소나 지식 JSON 형식·검증기·저장소와 시작 파일 생성기 추가` |
| Full SHA | `231677e4281eeeed6f3daa14224e85b027bb83db` |
| Short SHA | `231677e` |
| Branch | `feature/persona-knowledge-store` |
| Parent | `78d0f81` (develop) |
| Date | 2026-09-26T01:38:54+09:00 |

## 주 내용

- `persona-knowledge.types.ts`: `schemaVersion 1` 형식(core 최대 8줄, chunks 최대 200개, 본문 500자, 키워드 30개)과 위치를 알려 주는 검증기(중복 id·길이 초과 등)
- `persona-knowledge.store.ts`: 폴더 로드, mtime 캐시로 2초 간격 재확인(저장하면 재시작 없이 반영), `_`로 시작하는 파일은 읽지 않음, 깨진 파일은 무시하고 경고 로그
- `scripts/persona-build.mjs`와 `npm run persona:build`: DB 공개 카드 필드로 시작 파일 생성(없는 파일만, `--force`로 덮어쓰기, `--name`), 쓰기 전에 검증
- 생성기가 카드의 '모르는 것'에 "캐릭터 본인은 아직 모르고 스스로 꺼내지도 않는다" 표시를 붙이고, 가족·고향 같은 질문에서 검색될 '설정에 없는 개인사' 안전장치 조각을 자동 추가
- `.gitignore`: `apps/api/data/personas/*` 제외, `README.md`와 `_example.json`만 예외. 형식 예시는 가상 캐릭터 '한지우'

## 상세

**배경**
사용자가 챗봇이 페르소나 프롬프트를 읽고 자신의 성격을 이해할 수 있도록, ignore 처리한 JSON 파일을 LLM이 읽고 처리하는 RAG 기능을 요청했다. 최소한의 대화 흐름 유지와 환각(설정에 없는 사실 지어내기) 감소가 목적이다. 로컬 소형 모델(Ollama gemma4:e4b)로 바뀐 뒤 이 문제가 더 두드러진다.

**변경 범위**
apps/api(persona-rag 형식·저장소, scripts), 저장소 루트(.gitignore), apps/api/data/personas(_example.json)

**기술 포인트**
검증은 의존성 없이 직접 작성했다. 손으로 고치는 파일이라 첫 오류에서 멈추고 `chunks[3].keywords` 같은 위치를 적는다. `@Injectable` 클래스의 생성자에 문자열 인자를 두면 Nest가 주입 대상으로 착각하므로 폴더 지정은 정적 팩토리 `PersonaKnowledgeStore.at()`으로 뺐다. 생성기는 쓰기 전에 검증기를 통과시켜서, 상한을 넘는 출력(키워드 25개 → 상한 12개)을 실제로 걸러냈고 그 결과 키워드 상한을 30개로 올렸다.

**안 한 것**
검색(다음 브랜치), 컨텍스트 조립 연결(그 다음 브랜치), 임베딩. 유지성 실제 배경 설정은 채우지 않았다 — 카드에 없는 세부 설정은 사용자 확정 대기 항목이라 지어내지 않았다.

## 결과

**동작 확인**
단위 테스트: 예시 파일 유효성, 형식 오류 위치 안내(중복 id·길이·상한·schemaVersion), 저장소(캐릭터 이름으로 찾기, `_` 파일과 깨진 파일 무시, 폴더 없음, 파일 수정 시 재시작 없이 반영). `nest build`, oxlint 통과. 실제 DB로 `persona:build` 실행해 `유지성.json`(core 5줄, 조각 7개) 생성, `secret` 문자열이 포함되지 않았고 git에서 제외됨을 확인.

**리스크**
생성 파일에는 카드 원문이 들어간다. `.gitignore`로 제외돼 있지만, 실수로 강제 추가하지 않도록 주의.

**후속**
검색기, 컨텍스트 연결

**관련 문서**
[apps/api/data/personas/_example.json](../../../apps/api/data/personas/_example.json)
