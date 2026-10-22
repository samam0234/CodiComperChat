# 요청·응답 스키마 계층 추가

| 항목 | 내용 |
|------|------|
| Subject | `feat(ai): 요청·응답 스키마 계층 추가` |
| Full SHA | `8a172519265b6907e2a80b9c72c07c033b92bb81` |
| Short SHA | `8a17251` |
| Branch | `feature/ai-scaffold` |
| Parent | `78931e7` |
| Date | 2026-09-15 22:55:38 +0900 |

## 주 내용

- `services/ai/app/schemas/` 신설: `base`, `context`, `infer`, `summarize`, `critique`
- 라우트 3개(`/infer`, `/summarize`, `/critique-test`)에 요청 본문과 응답 모델 연결
- 통신 필드명을 **camelCase**로 고정 (`WireModel`)
- Repository 계층을 두지 않는 이유를 문서에 명시
- `apps/api`의 DTO 부재로 인한 필드명 드리프트 위험을 경고로 남김

## 상세

**배경**
사용자가 "라우터 폴더랑 서비스 폴더만 있는데 레포지토리단이랑 스키마단은 어디 있느냐"고 지적했다. 두 질문의 성격이 달랐다.

- **Repository 단**: 빠뜨린 것이 아니라 기획서 §7.4의 제약이다. "FastAPI는 원본 DB를 함부로 쓰지 않는다. 추론에 필요한 슬라이스만 Nest가 조립해 넘긴다." ai에 Repository를 두면 경계가 깨진다.
- **Schema 단**: 실제 누락이었다. 직전 커밋(`448b009`)에서 "실제 구현과 함께 넣는다"며 의도적으로 미뤘는데, 기획서 §7.5가 "프론트 폼 상태·Nest DTO·FastAPI 입력이 뼈대를 공유해야 하고 세 곳에서 필드명이 갈리면 공방이 먼저 망가진다"고 경고한 것을 보면 뼈대 단계에 있어야 할 층이었다. 판단을 바꿨다.

**변경 범위**
- 신규: `app/schemas/` 6개 파일
- 수정: `app/routes/` 3개, `app/services/` 3개 (요청 객체를 인자로 받도록)
- 문서: `Architecture/layers.md`, `plan/PROJECT_STRUCTURE.md`, `plan/CURRENT_STACK.md`, `API_DOCUMENTATION.md`, `services/ai/README.md`

**기술 포인트**
- `WireModel`(`alias_generator=to_camel`, `populate_by_name=True`)을 상속하면 통신은 camelCase, 파이썬 내부는 snake_case가 된다. 기획서 §7.5의 "세 곳이 같은 뼈대를 공유" 요구를 파이썬 관례를 깨지 않고 만족시키는 방법이다. 검증 결과 camelCase·snake_case 양쪽 본문 모두 받는다.
- `CharacterCore`는 카드 전체가 아니라 추론에 필요한 핵심만 받는다. **미해금 비밀은 본문 없이 `lockedSecretTopics`(주제만)로 넘긴다** — 기획서 §13.3의 "미해금은 제목만 또는 금지 목록" 요구를 스키마로 강제한 것이다. 본문을 넘기지 않으면 모델이 먼저 꺼낼 수 없다.
- `RelationAxis`에 `reason`을 필수로 두었다. 기획서 §4.2의 "숫자만 두지 않고 최근 근거 한 줄"이 UI 장식이 아니라 계약이 되도록 한 것.
- `SummarizeResponse`의 wire 필드명이 기획서 §13.4 목록과 정확히 일치하는 것을 OpenAPI로 확인했다: `brief`, `relationDelta`, `hooksOpen`, `hooksClosed`, `knowledgeGained`, `unlocks`, `nextPressure`.
- `CritiqueTestResponse`에 `secretLeak`을 넣었다. 기획서 §7.8이 "해금 전 비밀 키워드가 답변에 나왔는지 정도는 v1에서도 검사 가능"이라고 한 서버 점검 항목이다.
- 응답 모델을 명시한 라우트(`/summarize`, `/critique-test`)는 핸들러가 `NoReturn`이어도 `response_model=None`이 필요 없다. 명시한 모델이 우선한다.

**안 한 것**
- `/train`에는 스키마를 만들지 않았다. v1 정책상 닫힌 경로라 계약을 정의할 이유가 없다.
- LLM 클라이언트, 서비스 토큰 인증, pytest — 직전 커밋과 동일하게 보류.
- **Nest DTO** — ai 스키마와 짝을 맞춰야 하지만 이번 범위 밖이다. 대신 `layers.md`에 드리프트 경고를 남겼다.

**추정이 섞인 부분 (검토 필요)**
`ContextSlice`의 구조는 기획서 §13.3의 컨텍스트 예산 표(카드 핵심 / 캠페인 상태 / 활성 로어 / 최근 턴 / 장기 기억 / 디렉터 노트)를 그대로 옮겼으나, 각 조각의 **세부 필드 구성은 기획서에 없어 내가 구조화한 것**이다. `SummarizeResponse`처럼 원문이 목록을 준 것과 달리 확정된 계약이 아니므로, 실제 구현 단계에서 바뀔 수 있다.

## 결과

**동작 확인**
- 기동 성공, OpenAPI `components.schemas`에 모델 17종 노출
- 본문 없이 `POST /infer` → 422
- `honorific`을 잘못된 값으로 → 422, 오류 경로 `body.context.character.speech.honorific`까지 지목
- 올바른 camelCase 본문 → 501, 메시지에 "받은 최근 턴 1개"가 찍혀 파싱된 객체가 실제로 전달됨을 확인
- snake_case 본문 → 501 (populate_by_name 동작)
- `/health` 200, `/train` 계열 403 유지

**리스크**
- `ContextSlice` 세부 필드는 위에 적은 대로 추정이 섞여 있다.
- ai에는 계약이 있고 api에는 없는 비대칭 상태다. Nest DTO를 만들 때 필드명을 맞추지 않으면 기획서 §7.5가 경고한 드리프트가 그대로 발생한다.

**후속**
- Nest DTO 작성 시 이 스키마 필드명을 그대로 따를 것
- Prisma 스키마(기획서 §10 2번)와 `CharacterDraft`(§7.5) 정합성 확인

**관련 문서**
`docs/Architecture/layers.md`, `docs/API_DOCUMENTATION.md`, `docs/plan/PROJECT_STRUCTURE.md`, `services/ai/README.md`
