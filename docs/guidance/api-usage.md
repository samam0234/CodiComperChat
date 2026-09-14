# API 사용 (초안)

> 상태: **엔드포인트 미구현.** 경계 정의는 [../API_DOCUMENTATION.md](../API_DOCUMENTATION.md) 참고. 실제 구현되면 아래를 진짜 `curl` 예시로 교체한다.

## 목표 사용 예 (Nest, 웹이 치는 것만)

```bash
# 캠페인 시작
curl -X POST http://localhost:4000/campaigns \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"characterId": "<id>"}'

# 메시지 전송 (스트림)
curl -N -X POST http://localhost:4000/campaigns/<id>/messages \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"text": "지금 뭐 해?"}'
```

## 절대 하지 말 것

- 웹/클라이언트 코드에서 `services/ai`(FastAPI)의 `/infer`, `/summarize`, `/critique-test`, `/train`을 직접 호출하는 것. 항상 Nest(`apps/api`)를 거친다.

포트는 [../plan/CURRENT_STACK.md](../plan/CURRENT_STACK.md) 기준 제안값이며 미확정이다.
