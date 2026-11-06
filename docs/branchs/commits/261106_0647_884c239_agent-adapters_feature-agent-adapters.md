# 공동 작업자용 에이전트 어댑터 폴더 7개 추가

| 항목 | 내용 |
|------|------|
| Subject | `docs(agents): 공동 작업자용 에이전트 어댑터 폴더 7개 추가` |
| Full SHA | `884c2395ae6e2863186312138caeaa221dc68bd2` |
| Short SHA | `884c239` |
| Branch | `feature/agent-adapters` |
| Parent | `ad0127a` |
| Date | 2026-11-06 06:47:11 +0900 |

## 주 내용

- Gemini, Manus, Kimi, Ollama, OpenCode, Qwen, Windsurf 에이전트 전용 어댑터 폴더 7개를 만들었다
- 어댑터끼리 규칙이 어긋나지 않는지 보는 시험(`scripts/adapters.test.mjs`)을 더하고 CI에 넣었다

## 상세

**배경**
사용자가 공동 작업자가 생겼을 때 쓰는 AI 모델 환경이 다를 수 있으니, 다른 에이전트 폴더와 같은 양식으로 전용 폴더를 만들라고 했다(2026-11-06).

**변경 범위**
`.gemini/GEMINI.md`, `.qwen/QWEN.md`, `.windsurf/rules/codicomperchat.md`, `.manus/`·`.kimi/`·`.ollama/`·`.opencode/`의 `AGENTS.md`. 폴더마다 `skills/codicomperchat/SKILL.md` 포인터가 있다. 규칙 목록은 `.codex/AGENTS.md`의 것을 그대로 복제했다. `.agents/README.md`, 정본 SKILL.md, 루트 README, TESTING, ci.yml, ci-local.mjs를 맞췄다.

**기술 포인트**
정본은 그대로 `.agents/skills/codicomperchat/SKILL.md` 하나이고 어댑터는 가리키기만 한다. 어댑터가 늘면 규칙이 한쪽만 고쳐져 어긋나기 쉬워서 시험을 더했다. Windsurf만 규칙 앞머리(`trigger: always_on`)가 있다.

**안 한 것**
각 도구가 이 폴더와 파일 이름을 실제로 자동으로 읽는지는 확인하지 않았다. 도구별 설정 파일(설정 JSON 등)은 만들지 않았다.

## 결과

**동작 확인**
`node --test scripts/adapters.test.mjs` 30개 통과(기록 작성기 시험과 합쳐 36개).

**리스크**
도구가 읽는 파일 이름이 다르면 규칙이 적용되지 않는다. 그럴 때는 루트 `AGENTS.md`를 가리키게 설정한다.

**후속**
공동 작업자가 실제로 쓰는 도구가 정해지면 그 도구의 자동 로딩을 확인한다.

**관련 문서**
[.agents/README.md](../../../.agents/README.md)
