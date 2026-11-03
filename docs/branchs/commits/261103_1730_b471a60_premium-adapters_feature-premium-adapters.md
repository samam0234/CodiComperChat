# 프리미엄 모델 Claude·Grok 호출 연동

| 항목 | 내용 |
|------|------|
| Subject | `feat(models): 프리미엄 모델 Claude·Grok 호출 연동` |
| Full SHA | `b471a60d553249bef22d2a4eac4e4d9b9b54bc21` |
| Short SHA | `b471a60` |
| Branch | `feature/premium-adapters` |
| Parent | `3501523` |
| Date | 2026-11-03 17:30:53 +0900 |

## 주 내용

- 프리미엄 모델(Claude·Grok)의 호출 코드를 넣었다. `PREMIUM_PROVIDERS`로 연 공급자만 쓸 수 있고 기본은 닫혀 있다
- 대화 화면에 AI 고지와 외부 전달 안내를, 처리방침에 Anthropic·xAI 전달을 넣었다

## 상세

**배경**
2026-11-03 사용자 결정: "일단 연동 해보기".

**변경 범위**
`services/ai/app/services/premium.py`(새 파일), `llm.py`, `inference.py`, `schemas/infer.py`, `requirements.txt`, `apps/api/src/models/models.ts`, `character-chat`, 대화 화면, 처리방침, 운영 compose, `.env.example`, 관련 문서.

**기술 포인트**
- 경로는 웹 → Nest → services/ai → 공급자다. 키는 services/ai에만 둔다
- Anthropic SDK 2.4.0은 httpx가 아니라 httpx2를 쓴다. 시험의 가짜 전송 계층도 httpx2로 만들어야 한다
- Claude에 temperature를 보내지 않고, 첫 메시지가 assistant이면 user 한 줄을 앞에 넣는다
- Grok은 Responses API를 `store: false`로 부른다. 저장된 id(`grok-4-5`)와 보내는 이름(`grok-4.5`)이 다르다
- 오류 문구에 공급자 응답 본문을 넣지 않는다
- 성인 모드 그림 설계는 이 경로로 오지 않는다. Anthropic 사용 정책이 성적 콘텐츠 생성을 금지한다

**안 한 것**
실제 API 호출(키 없음), 18세 미만의 프리미엄 차단, 서비스 전체 지출 상한.

## 결과

**동작 확인**
AI unittest 22개(이번에 13개 추가), API 200개, API·웹 타입 검사 통과. 실제 공급자 호출은 하지 않았다. 요청 모양과 오류 변환만 가짜 전송 계층으로 봤다.

**리스크**
열면 무료 출석 코레딧이 실제 지출이 된다. 키를 넣기 전에 공급자 콘솔에서 월 한도를 걸어야 한다.

**후속**
키를 넣고 `python -m evals.premium_check`로 실제 호출을 확인한다. 병합은 사용자 지시를 기다린다.

**관련 문서**
[AI_MODEL_STRATEGY.md](../../plan/AI_MODEL_STRATEGY.md)
