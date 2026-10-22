# 웹 자동 테스트 (e2e)

실제 브라우저(Chrome)로 화면 흐름을 돌려, 고친 뒤에 화면이 깨졌는지 바로 알게 한다. LLM은 **가짜**(`LLM_FAKE=1`)라
모델 없이 1분 안팎에 끝나고 결과가 매번 같다. AI 말투·환각 품질은 여기가 아니라 `services/ai/evals`가 본다.

```bash
npm run test:e2e                              # 전체 (준비 → 서버 3개 기동 → 테스트)
npm run test:e2e -- tests/chat.spec.ts        # 한 파일만
npm run test:e2e -- -g "신고"                  # 이름으로 골라서
npx playwright show-trace e2e/.tmp/test-results/<실패한 테스트>/trace.zip   # 실패 추적
```

필요한 것: 로컬 PostgreSQL(개발 DB와 같은 서버), 설치된 Chrome, `services/ai/.venv`(FastAPI 의존성). 개발 서버를 켜 둔 채로 돌려도 된다.

## 개발 환경과 겹치지 않는 구조

| | 개발 | e2e |
|--|------|-----|
| 웹 | 3000, `.next` | **3101**, `apps/web/.next-e2e` |
| API | 4000, `dist` | **4101**, `dist-verify` |
| AI | 8000, 실제 Ollama | **8101**, 가짜 LLM |
| DB | `codicomperchat` | **`codicomperchat_e2e`** (같은 서버, 없으면 만든다) |
| 지식 파일 | `apps/api/data/personas` | `e2e/.tmp/personas` |

`e2e/prepare.mjs`가 매번 먼저 돈다: DB 만들기 → 마이그레이션 → **전체 비우기** → 공식 캐릭터(`e2e-official`) 심기 → API 빌드.
DB 주소는 `apps/api/.env`의 `DATABASE_URL`에서 데이터베이스 이름만 바꿔 쓴다(비밀번호를 코드에 두지 않는다). 다른 DB를 쓰려면 `E2E_DATABASE_URL`.

## 무엇을 보나

| 파일 | 흐름 |
|------|------|
| `auth.spec.ts` | 보호된 페이지, 가입→로그아웃→로그인, 잘못된 비밀번호, 내 프로필 만들기 |
| `chat.spec.ts` | 프로필 필수·고정, 새로하기(저장/안 함)·이어하기, 엑스트라 적용, 지난 이야기·친밀도·복선 |
| `studio.spec.ts` | 자동 저장, 3턴 테스트→발행, 카드 수정 시 테스트 무효, 말투 샘플, AI 초안(비밀 칸 제외), 프롬프트 연장, 초상 업로드·검사·접근, 공개 범위 |
| `reports.spec.ts` | 신고→운영자 내리기→숨김·주인 안내→복구, 신고 기각 |

## 쓰는 요령

- 준비(계정·초안·데이터)는 `helpers.ts`의 `api()`로 Nest를 직접 부르고, **화면에서 확인할 것만** 브라우저로 한다. 그래야 빠르고 덜 깨진다.
- 이메일 칸은 브라우저가 아이디 부분의 한글을 막는다 → 가입 이메일은 영문·숫자 (`signup()`이 알아서 만든다).
- 개발 서버는 첫 로딩 때 하이드레이션이 늦다. 폼을 누르기 전에 `await page.waitForLoadState("networkidle")`.
- 서버 액션 뒤에 바로 다른 페이지로 이동하지 말고, 끝났다는 신호(URL·문구)를 기다린다.
- 테스트는 한 번에 하나씩(같은 DB). 테스트마다 새 계정을 만들어 서로 간섭하지 않는다.
- 일부러 규칙을 고장 내 보면(예: 비공개 캐릭터를 모두에게 보이게) 관련 테스트가 실패하는 것을 확인했다.
