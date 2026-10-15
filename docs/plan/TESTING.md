# 테스트 전략

> 상태: **`apps/api`(vitest 단위)와 웹 화면(Playwright e2e 21개)과 AI 품질 평가(`services/ai/evals`)가 실재.** `services/ai`의 pytest 단위 테스트는 아직 없다.

## 앱별 도구

| 앱 | 도구 | 상태 | 계층 |
|----|------|------|------|
| `apps/api` (Nest.js) | **vitest** (`vitest.config.ts` / `vitest.config.e2e.ts`), 린트는 **oxlint** | 실재 — e2e 2건 통과 | 컨트롤러/서비스/DTO |
| `apps/web` (Next.js) | **Playwright e2e** (`e2e/`, 가짜 LLM, 별도 포트·DB) | 실재 — 21건 통과 | 화면 흐름 회귀. 사용법: [e2e/README.md](../../e2e/README.md) |
| `services/ai` 품질 | **evals** (`python -m evals.run`, 실제 모델) | 실재 — 6묶음 | 말투·설정 덮어쓰기·메타 발언·강의식·개인사 단정·판정 안정성. 사용법: [services/ai/README.md](../../services/ai/README.md) |
| `services/ai` (FastAPI) | pytest | 미도입 (앱은 있으나 테스트 설정 없음) | 라우트/컨텍스트 조립/요약 파싱 |

> Nest 12는 Jest가 아니라 **vitest**로 스캐폴드된다. 이전 판 문서에 "Nest 기본 Jest"라고 적혀 있었으나 실제와 달라 바로잡았다.

## 명령

```bash
npm run test:api        # vitest 단위 테스트
npm run test:api:e2e    # vitest e2e (앱을 띄워 라우트 확인)
npm run test:e2e        # 웹 화면 e2e (Chrome, 가짜 LLM, 별도 DB — 개발 서버와 같이 켜 둬도 된다)
```

AI 품질은 `cd services/ai && ./.venv/Scripts/python.exe -m evals.run` (로컬 Ollama 필요).

## 자동 테스트보다 먼저 확인해야 하는 것 — 플레이테스트 시트 (계획서 §14)

이 제품의 핵심 실패는 유닛테스트로 잘 안 잡힌다("말투가 20턴 버티는가" 같은 것). 데모 전 통과 기준:

1. 첫 화면만 보고 "캐릭터챗" 외에 무엇이 다른지 한 문장으로 말할 수 있는가
2. 첫 5턴 안에 비서가 아니라 인물이 보이는가
3. 세션을 닫고 다시 열었을 때, 캐릭터가 시스템 로그가 아니라 자기 입으로 지난 일을 꺼내는가
4. 아직 잠긴 비밀을 유저가 유도해도 먼저 털지 않는가
5. 같은 질문 `"지금 뭐 해?"`를 공방 샘플과 실제 세션에서 비교해도 말투가 같은가
6. 관계 숫자를 숨겨도 대사만으로 관계가 변한 느낌이 나는가
7. 로어를 많이 넣은 카드에서 최근 장면이 흐려지지 않는가
8. FastAPI가 죽어도 Nest가 유저 메시지를 잃지 않는가 (적어도 저장)
9. 공방에서 갈등과 비밀이 비어 있으면 발행이 막히거나 강하게 경고되는가
10. 팀이 "학습이 없어서 차별점이 없다"고 느끼는가 — 느낀다면 상태 UI가 약하거나 카드가 약한 것이다. 모델 탓으로 가지 말 것

이 10문항이 실제 실행 가능한 체크리스트로 옮겨진 곳: [vaildates/mvp-checklist.md](../vaildates/mvp-checklist.md)

## 공방 발행 가드 (계획서 §6.3)

- 테스트 3턴에서 설명충/캐릭터 붕괴가 보이면 발행을 막거나 경고
- 비밀과 갈등 씨앗이 둘 다 비면 "캠페인 밀도 부족" 경고

이 로직은 FastAPI `POST /critique-test`가 판정하고 Nest `POST /studio/characters/:id/publish`가 게이트한다 (`API_DOCUMENTATION.md` 참고).

## 부하 측정 (`npm run bench`)

가짜 LLM을 느리고 한 번에 하나만 처리하게 만들어(`FAKE_LLM_DELAY_MS`, `FAKE_LLM_SERIAL=1`) 로컬 Ollama 한 대와 비슷한 상황을 흉내 낸다.
`npm run bench -- --users 8 --delay 1500`: 읽기 처리량, 동시 채팅 응답 시간, 이야기 정리(배경 작업) 지연, 연속 채팅 꼬리 지연을 잰다.

AI 호출은 `apps/api/src/ai/ai-queue.ts` 대기열을 지난다. 동시 호출 수는 `AI_CONCURRENCY`(기본 2, API 서버 한 대 기준 — 서버가 여러 대면 모델이 받는 동시 호출은 대수 × 이 값이므로 대수로 나눠 정한다), 기다리는 답이 배경 작업(기억·이야기 요약)보다 먼저 처리되고,
기다리는 답은 60초 넘게 줄서면 503, 모델 응답은 130초(배경 150초)가 넘으면 504로 끊는다. 현재 상태는 `GET /health`의 `ai`.

측정(사용자 8명, 모델 1.5초 직렬): 연속 채팅 p95 33.0초 → 12.0초, 읽기 927 req/s(p95 13ms), 이야기 정리는 평균 약 20초 지연되나 끝까지 완료된다.

## CI (`.github/workflows/ci.yml`)

develop·main에 올리거나 PR을 열면 GitHub Actions가 돈다. 모델·돈·메일 없이 돈다(가짜 LLM, 가짜 결제, 메일은 폴더로).

| 단계 | 내용 |
|---|---|
| checks | `npm ci` → Prisma 생성·마이그레이션(PostgreSQL 16 서비스) → `oxlint --deny-warnings`(경고도 실패) → 타입 검사(api, web) → API 단위 테스트(DB 한도 저장소 시험 포함) → AI 서비스 불러오기(`compileall`, `import app.main`) |
| e2e | checks가 통과하면. PostgreSQL 서비스에 `codicomperchat_e2e`를 만들어 `npm run test:e2e`. 실패하면 화면·추적을 `e2e-results`로 올린다(7일 보관) |

AI 품질 평가(`evals`)는 실제 모델(Ollama)이 있어야 해서 CI에 넣지 않았다. 모델을 바꾸거나 프롬프트를 고치면 로컬에서 돌린다.
