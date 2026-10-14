# 대화 새로하기·이어하기와 대화별 프로필 고정 추가

| 항목 | 내용 |
|------|------|
| Subject | `feat(chat): 대화 새로하기·이어하기와 대화별 프로필 고정 추가` |
| Full SHA | `aa05e144a982b51d8ade523a0de55400dbbeb582` |
| Short SHA | `aa05e14` |
| Branch | `feature/chat-sessions` |
| Parent | `2ac9357` (develop) |
| Date | 2026-10-15T05:25:29+09:00 |

## 주 내용

- 대화(Campaign)를 캐릭터마다 "지금 대화"(ACTIVE) 1개 + "저장한 대화"(CLOSED) 여러 개로 바꿈 (마이그레이션 `chat_sessions`: `personaId`·`personaName`·`personaDescription`·`savedAt`, 인덱스 `[userId, characterId, status]`)
- 새로하기 `POST /characters/:id/chat/new { save }`, 이어하기 `GET /chat/saved`·`POST /chat/saved/:campaignId/resume { saveCurrent }`, `DELETE /chat/saved/:campaignId`
- 첫 메시지 때 내 프로필을 대화에 고정(이름·소개 스냅숏). 다른 프로필로 보내는 메시지·대답 추천은 409
- 대화 목록은 캐릭터마다 한 줄 + 저장한 대화 수
- 웹: 새로하기(저장 확인 상자)·이어하기 버튼, 이어하기 목록 페이지, 잠긴 프로필 표시, 공용 확인 상자 `components/choice-dialog.tsx`, ⋮ 메뉴 "저장한 대화"
- 에이전트 기능 목록, API 문서, NAVIGATION_IA

## 상세

**배경**
사용자 지시: 대화 기록을 저장하고 새로 시작하거나 저장한 대화를 이어서 할 수 있게(새로하기 = "대화를 저장하시겠습니까?" → 저장하겠습니다면 저장, 아니면 초기화 / 이어하기 = 캐릭터의 대화 기록 목록에서 골라 이어서). 한 대화에서 내 프로필을 한 번 고르면 새로하기 전까지 바꿀 수 없게. 사용자 선택: 기억·상태설정은 대화마다 따로.

**변경 범위**
apps/api(prisma, conversations, character-chat), apps/web(채팅, 이어하기 페이지, 대화 목록, 공용 확인 상자, 서버 액션), services/ai(assist 기능 목록), docs

**기술 포인트**
- 기존 `CampaignStatus`(ACTIVE/CLOSED)를 그대로 써서 "지금/저장한" 대화를 나눴다. 기억(MemoryChunk)·상태(CampaignState)는 원래 대화에 붙어 있어서, 대화마다 따로가 따로 손대지 않아도 성립한다.
- 메모리·상태설정 API는 모두 `conversations.find()`(이제 ACTIVE만)를 거치므로 "지금 대화" 기준으로 바뀐다.
- 프로필 고정은 화면만이 아니라 Nest가 막는다(409). 고정 시 이름·소개를 대화에 복사해 두어, 마이페이지에서 프로필을 고치거나 지워도 진행 중인 대화가 흔들리지 않는다.
- 한 마디도 안 한 대화는 "저장"해도 목록에 쌓지 않는다(빈 대화로 목록이 더러워지지 않게).
- 이어하기 전에 지금 대화에 나눈 말이 있으면 같은 확인 상자로 저장 여부를 먼저 묻는다(지금 대화가 말없이 사라지지 않게).

**안 한 것**
- 저장한 대화 이름 바꾸기, 회차(Session) 나누기·요약(기획서 13.4)

## 결과

**동작 확인**
- API(임시 서버 4998 + 실제 Ollama) 19개 통과: 처음 상태, 첫 메시지 뒤 고정, 다른 프로필 409(메시지·추천), 새로하기 저장 → 새 대화 초기 상태(친밀도·호칭 초기값), 저장 목록(제목·프로필), 이어하기(저장 안 함 → 지금 대화 삭제, 되살린 대화의 친밀도·호칭 복귀), 이어하기(저장 → 자리 바꿈), 삭제 204, 없는 대화 404, 빈 대화 저장 안 쌓임, 대화 목록 한 줄 + 저장 수, 401
- 브라우저(web 3000 → api 4000, Chrome) 13개 통과: 프로필 잠김·새로고침 유지, 저장 확인 상자, 저장 후 새 대화, 이어하기 수 표시, 이어하기 목록, 지금 대화 저장 확인, 이어하기 후 내용·잠김 복귀, 저장 안 함 → 목록 비어 있음, 390px 가로 스크롤 없음, 오류 없음
- 단위 테스트 61개, `typecheck:api`, oxlint, web `tsc --noEmit`

**리스크**
기존 대화는 프로필이 비어 있어 다음 메시지 때 그 프로필로 고정된다.

**후속**
엑스트라 설정, 공방 공개 범위, 프롬프트 연장

**관련 문서**
[docs/API_DOCUMENTATION.md](../../API_DOCUMENTATION.md), [docs/plan/NAVIGATION_IA.md](../../plan/NAVIGATION_IA.md)
