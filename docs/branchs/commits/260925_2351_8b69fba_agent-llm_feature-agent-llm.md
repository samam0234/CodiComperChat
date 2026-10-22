# 에이전트 챗봇을 Gemini에 연결하고 LLM 호출 공통부 분리

| 항목 | 내용 |
|------|------|
| Subject | `feat(ai): 에이전트 챗봇을 Gemini에 연결하고 LLM 호출 공통부 분리` |
| Full SHA | `8b69fba0cc3f95297000822f79552d1128a236a3` |
| Short SHA | `8b69fba` |
| Branch | `feature/agent-llm` |
| Parent | `bc4fcf1` (develop) |
| Date | 2026-09-25T23:51:31+09:00 |

## 주 내용

- FastAPI `POST /assist`: 안내 챗봇용 시스템 프롬프트 + 대화 기록 → Gemini 답변
- `services/ai/app/services/llm.py`: 키 확인·5xx 재시도·429/502 변환을 한곳으로. `inference.py`가 이를 사용
- Nest `apps/api/src/ai/ai-client.ts`: FastAPI 호출 공통부. 캐릭터 채팅과 에이전트가 공유
- Nest `POST /agent-chat/messages`: 503 고정 응답 대신 `/assist` 중계, 기록 20턴·메시지 2000자 상한
- 에이전트 화면이 대화 기록을 함께 보내 앞 대화를 이어받음, 추천 질문 문구를 실제 기능에 맞게 교체

## 상세

**배경**
사용자가 에이전트에도 LLM을 적용하길 원했다. 기존 `AgentChatService`는 "호스티드 LLM 벤더 미정" 사유의 503만 던지는 자리였고, 이후 Gemini가 개발용 LLM으로 정해져 연결할 수 있게 됐다.

**변경 범위**
services/ai(llm, inference, assist), apps/api(ai-client, agent-chat, character-chat 서비스), apps/web(에이전트 화면·중계 라우트), 문서(API, CURRENT_STACK, NAVIGATION_IA)

**기술 포인트**
범위 제한은 시스템 프롬프트로 한다. 프롬프트의 기능 목록이 곧 에이전트가 아는 전부라 실제 구현된 것만 적었고, 기능이 바뀌면 `assist.py`도 같이 고쳐야 한다. 429는 재시도하면 무료 등급 한도만 더 깎여 재시도에서 제외하고 "잠시 후 다시" 안내로 돌려준다. 오류 안내(system) 메시지는 대화 기록에서 뺀다.

**안 한 것**
스트리밍 응답, 로그인 사용자별 대화 저장, 에이전트의 사용량 제한(rate limit).

## 결과

**동작 확인**
FastAPI `/assist` 실제 호출 3종 통과: 앞 대화를 이어받는 후속 질문, 범위 밖 요청(코딩) 정중한 거절, 없는 기능(대화 기록 보기) 솔직한 안내. 마크다운 기호 제거 확인(`**` 0개). 빈 메시지·잘못된 role은 422. 브라우저에서 추천 질문 → 답변 → 후속 질문이 앞 대화를 참조(마이페이지 언급)하는 것까지 확인. `nest build`, 웹 `tsc` 통과.

**리스크**
`llm.py`의 `DEFAULT_MODEL`이 `gemini-3-flash`로 되어 있는데 Google에서 이 이름은 존재하지 않는 모델(404)로 확인됐다. `services/ai/.env`의 `GEMINI_MODEL`도 같은 값이라 지금 그대로면 모든 LLM 호출이 실패한다. 공식 문서상 이름은 `gemini-3-flash-preview`(테스트에 사용)이다. 무료 등급은 분당 한도(429)에 자주 걸린다.

**후속**
모델명 정정, 스트리밍 응답, 요청 속도 제한

**관련 문서**
[docs/API_DOCUMENTATION.md](../../API_DOCUMENTATION.md), [docs/plan/CURRENT_STACK.md](../../plan/CURRENT_STACK.md), [docs/plan/NAVIGATION_IA.md](../../plan/NAVIGATION_IA.md)
