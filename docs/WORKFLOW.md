# AI 호출 파이프라인 (요약)

정본: `CodiComperChat_project_plan.md` §7.6. 코드가 생기면 위치는 `apps/api/`(Nest 부분)와 `services/ai/`(FastAPI 부분)에 나뉜다.

## 한 번의 유저 메시지 처리

```text
Next.js
  → Nest POST /campaigns/:id/messages (스트림 요청)
      → 인증, 세션 잠금, 유저 메시지 저장
      → 컨텍스트 슬라이스 조립
          ├ 캐릭터 카드 핵심
          ├ 활성 로어 (키워드 매칭)
          ├ 캠페인 상태 (관계·훅·지식)
          ├ 최근 메시지 N턴
          └ 관련 장기 기억 검색 K개
      → FastAPI POST /infer (스트림 호출)
          → 캐릭터 에이전트 응답 스트림
          → (필요 시) 숨은 디렉터가 "이번 턴 연출 노트"를 앞에 붙임
      → 토큰을 Next로 중계, 완료 후 어시스턴트 메시지 저장
  → 세션 종료 또는 N턴마다 FastAPI POST /summarize
      → Nest가 CampaignState에 델타 머지
```

## 원칙

- 숨은 디렉터를 매 턴 풀 생성으로 돌리지 않는다 — 턴마다 짧은 체크(갈등/해금/장면전환 여부)만, 본 생성은 캐릭터 한 번.
- 학습(`/train`)은 별도 워커 경로. v1은 인터페이스만 남기고 막아 둔다.

## 컨텍스트 예산 (계획서 §13.3)

| 조각 | 우선순위 | 비고 |
|------|----------|------|
| 시스템 + 카드 핵심 | 고정 | 성격 축, 말투, 비밀(미해금은 제목만/금지 목록) |
| 캠페인 상태 | 짧고 구조화 | 숫자 + 근거 한 줄 + 훅 목록 |
| 활성 로어 | 매칭된 것만 | `always`는 극소만 |
| 최근 턴 | 우선 | 가장 비싼 자리를 여기에 준다 |
| 장기 기억 검색 | K개 | 원문 전체가 아니라 청크 |
| 디렉터 노트 | 2~4문장 | 매 턴 풀에세이 금지 |

관련: [API_DOCUMENTATION.md](API_DOCUMENTATION.md), [plan/AI_MODEL_STRATEGY.md](plan/AI_MODEL_STRATEGY.md)
