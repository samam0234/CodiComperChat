# Anthropic SDK를 프리미엄 호출 때만 불러오기

| 항목 | 내용 |
|------|------|
| Subject | `perf(ai): Anthropic SDK를 프리미엄 호출 때만 불러오기` |
| Full SHA | `123c35f86395ddbd440fee0221a063f284e067db` |
| Short SHA | `123c35f` |
| Branch | `feature/adult-mode-switch` |
| Parent | `56b6964` |
| Date | 2026-11-03 17:58:04 +0900 |

## 주 내용

- Anthropic SDK를 프리미엄을 실제로 부를 때만 불러온다

## 상세

**배경**
연동 뒤 전체 e2e에서 시간 초과 2건이 나왔다. 원인 후보로 SDK를 재 보니 불러오는 데 약 2~11초, 메모리 약 58MB가 든다. 요청마다 드는 비용은 아니지만 무료 모델만 쓰면 필요 없다.

**변경 범위**
`services/ai/app/services/llm.py`.

**기술 포인트**
`llm.py` 맨 위의 import를 프리미엄 분기 안으로 옮겼다.

**안 한 것**
이 변경이 시간 초과를 고쳤다고 단정하지 않는다. 인과는 재지 않았다.

## 결과

**동작 확인**
AI 서비스 시작 직후 `anthropic`이 불러와져 있지 않음을 확인했다. AI unittest 22개 통과. 실패했던 chat·reports 두 파일 8개를 다시 돌려 통과했다.

**리스크**
프리미엄 첫 호출이 그만큼 늦다.

**후속**
전체 e2e 재실행.

**관련 문서**
[AI_MODEL_STRATEGY.md](../../plan/AI_MODEL_STRATEGY.md)
