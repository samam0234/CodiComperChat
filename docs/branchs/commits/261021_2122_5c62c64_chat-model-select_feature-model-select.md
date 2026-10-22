# 대화마다 쓰는 모델을 고르는 기능 추가

| 항목 | 내용 |
|------|------|
| Subject | `feat(chat): 대화마다 쓰는 모델을 고르는 기능 추가` |
| Full SHA | `5c62c64d5ec6eb8461de4096131bc2400148ae64` |
| Short SHA | `5c62c64` |
| Branch | `feature/model-select` |
| Parent | `749aeb6` (develop) |
| Date | 2026-10-21T21:22:59+09:00 |

## 주 내용

- 대화마다 답을 쓸 모델을 고르는 기능: 기본 무료(gemma4:e4b) / 강화 무료(gemma4:12b, 하루 30번) / 프리미엄 Claude 8개·Grok 3개
- 프리미엄은 프로 등급만, 외부 연동이 없어 지금은 "준비 중"으로 잠금 (서버가 403, 화면은 안내)
- `GET /models`, 채팅 요청의 `model`, 대화에 모델 저장(`campaigns.chatModel`), 하루 횟수 `model_usage`
- 채팅 화면 입력창 아래 "모델" 칸 (잠긴 모델은 이유와 함께 비활성, 강화 무료는 "오늘 N/30")
- FastAPI `/infer`가 태그 모양만 받는 `model`을 받아 그 호출만 다른 Ollama 모델로 보냄

## 상세

**배경**
사용자 요청("모델 선택 기능도 만들어 줄 수 있어? … 기본 무료 모델, 강화 무료 모델 하루 30번, 프리미엄 모델들")에 따라 만들었다. 질문으로 정한 것: 프리미엄은 목록·선택·잠금까지만, 대화마다 선택, 프리미엄은 프로 등급만, 강화 한도는 캐릭터 답 1회=1번.

**변경 범위**
apps/api(models 모듈·conversations·character-chat·prisma 마이그레이션), services/ai(infer·llm), apps/web(채팅 화면·lib/models), e2e

**기술 포인트**
- 하루 횟수는 한 문장 upsert(WHERE count < limit)로 답을 만들기 전에 잡고, 답을 못 만들면 돌려준다 — 동시 요청도 한도를 넘지 않는다
- 날짜는 한국 시각(KST) 기준 YYYY-MM-DD
- 대화에 저장된 모델이 이제 못 쓰는 것(프로 끝·한도 소진)이고 요청에 모델이 없으면 기본 무료로 조용히 내려간다. 요청에 모델을 명시했는데 안 되면 403
- 기억·요약·개인사 확인·추천·검수·판정은 기본 모델 그대로 (한도 절약, 판정 안정성). 개인사 때문에 다시 쓸 때만 같은 모델
- FastAPI의 model은 `^[A-Za-z0-9][A-Za-z0-9._:-]{0,63}$`만 받는다
- e2e API는 MODEL_ENHANCED_DAILY_LIMIT=2로 줄여 한도 경로를 시험

**안 한 것**
Claude·Grok 실제 호출(API 키·어댑터)은 사용자 결정으로 보류. 프리미엄 모델별 하루 한도도 아직 정하지 않음

## 결과

**동작 확인**
- oxlint, 타입 검사 api·web, API 단위 테스트 169개 통과
- e2e models.spec 4개 + chat·plan 통과
- 실제 로컬 Ollama에서 기본 모델과 gemma4:12b 둘 다 응답 확인

**리스크**
마이그레이션 20261021120000_chat_model(컬럼 추가·테이블 추가)을 개발 DB에 `prisma migrate deploy`로 적용해야 한다. 켜 둔 API 개발 서버는 다시 시작해야 새 코드를 쓴다

**후속**
프리미엄 연동 시 models.ts의 PROVIDER_READY와 Nest 호출 어댑터, 프리미엄 하루 한도 결정

**관련 문서**
API_DOCUMENTATION, AI_MODEL_STRATEGY, DATABASE, NAVIGATION_IA, environment
