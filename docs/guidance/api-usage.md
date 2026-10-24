# API 사용 (curl로 직접 부르기)

개발 중 Nest를 직접 불러 확인하는 법. 전체 목록·응답은 [../API_DOCUMENTATION.md](../API_DOCUMENTATION.md). 최종 갱신 2026-10-24.

## 전제

- api(4000)·ai(8000)·Ollama가 떠 있다 ([getting-started.md](getting-started.md))
- 로그인이 필요한 요청은 `Authorization: Bearer <토큰>`. 웹은 이 토큰을 httpOnly 쿠키에 넣어 서버에서 붙인다

## 명령

```bash
API=http://localhost:4000

# 가입 → 토큰 (응답의 token)
curl -s -X POST $API/auth/signup -H "Content-Type: application/json" \
  -d '{"email":"me@example.com","password":"pass1234word","displayName":"민준"}'

# 로그인 → 토큰
TOKEN=$(curl -s -X POST $API/auth/login -H "Content-Type: application/json" \
  -d '{"email":"me@example.com","password":"pass1234word"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')

# 캐릭터 목록 (로그인 없이)
curl -s $API/characters

# 대화하려면 내 프로필 캐릭터가 필요하다
PERSONA=$(curl -s -X POST $API/me/personas -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"민준","description":"고3 수험생"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).id')

# 캐릭터와 대화 (답이 다 오면 한 번에 온다. 첫 답은 모델을 올리느라 오래 걸릴 수 있다)
curl -s -X POST $API/characters/<캐릭터id>/chat -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d "{\"message\":\"지금 뭐 해?\",\"personaId\":\"$PERSONA\"}"

# 지금 대화 기록 · 지난 이야기 · 기억
curl -s $API/characters/<캐릭터id>/chat         -H "Authorization: Bearer $TOKEN"
curl -s $API/characters/<캐릭터id>/chat/story   -H "Authorization: Bearer $TOKEN"
curl -s $API/characters/<캐릭터id>/chat/memories -H "Authorization: Bearer $TOKEN"

# 서버·AI 대기열 상태
curl -s $API/health
```

## 기대 결과

| 요청 | 결과 |
|------|------|
| 가입·로그인 | `{ token, user }` (`user.emailVerified`는 처음에 false) |
| 대화 | `{ reply }` · 프로필 없음 400, 한도 초과 429(`Retry-After`), 모델이 밀리면 503·504 |
| `/health` | `{ status: "ok", …, ai: { inFlight, waitingForeground, waitingBackground, concurrency } }` |

## 절대 하지 말 것

- 웹/클라이언트 코드에서 `services/ai`(FastAPI)를 직접 호출하는 것. 항상 Nest(`apps/api`)를 거친다
- 진짜 비밀번호·토큰을 문서나 대화에 붙이는 것 (위 예시는 개발용 값)

계획서 §13.1의 `/campaigns/*`는 라우트만 있고 501이다 — 대화는 위의 `/characters/:id/chat*`을 쓴다.
