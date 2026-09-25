# 입력창 왼쪽 대답 추천(3개)과 초기화 추가

| 항목 | 내용 |
|------|------|
| Subject | `feat(web): 입력창 왼쪽 대답 추천 3개와 초기화 추가` |
| Full SHA | `741b0d5dc20c6c3b8cbcca35b064ca0f1a3779ff` |
| Short SHA | `741b0d5` |
| Branch | `feature/reply-suggestions` |
| Parent | `5991b0e` (feature/required-persona) |
| Date | 2026-09-25T23:51:36+09:00 |

## 주 내용

- FastAPI `POST /suggest-replies`: 컨텍스트 + `avoid` → 주인공의 다음 대사 3개(JSON 스키마 강제, 각 120자 이내)
- Nest `POST /characters/:id/chat/suggestions`: 로그인·프로필 소유 확인 후 중계, `avoid` 최근 12개
- 웹 중계 라우트와 채팅 화면: 동그란 추천 버튼, 입력창 위 추천 패널, 초기화·닫기, 로딩 스켈레톤, 오류 안내
- "초기화"는 최근 9개 추천을 `avoid`로 넘겨 겹치지 않게 하고, 태도를 무작위로 섞어 매번 다른 결과를 냄
- 좁은 화면에서 "보내기"가 줄바꿈되지 않게 입력창 레이아웃 보정

## 상세

**배경**
사용자가 입력창 왼쪽에 동그란 "대답 추천" 버튼을 두고, 누르면 입력창 위에 상황에 어울리는 내 대답 3개를 고르게 하며, 초기화하면 랜덤으로 바뀌길 원했다.

**변경 범위**
services/ai(suggest 스키마·서비스·라우트), apps/api(character-chat 컨트롤러·서비스), apps/web(채팅 화면·중계 라우트), 문서(API, CURRENT_STACK, NAVIGATION_IA)

**기술 포인트**
"랜덤"은 온도(temperature 1.1)와 함께, 프롬프트에 매번 무작위로 뽑은 태도 세 가지를 지정해 확실히 갈라지게 했다. 다시 받기에는 이미 보여 준 추천을 `avoid`로 넘겨 반복을 막는다. 응답은 `response_json_schema`로 배열 3개를 강제하고 부족하면 502로 처리한다. 프로필 소개는 유저 입력이라 `<user_persona>` 블록으로 감싸 지시로 따르지 않게 했다.

**안 한 것**
추천 사용 횟수 제한, 추천 캐시, 추천을 고른 뒤 자동 전송.

## 결과

**동작 확인**
FastAPI 실제 호출: 프로필·대화를 반영한 3개 생성(예: "수학을 싫어함" 반영), 초기화 시 전부 다른 3개. 브라우저 18개 시나리오 통과: 프로필 선택 전 버튼 비활성, 추천 3개, 초기화로 전부 새 추천, 추천 클릭 시 입력창 채움·패널 닫힘, 전송 후 답장, 대화 뒤 다시 열면 새로 받음. 320px·390px에서 가로 스크롤 없음, "보내기" 한 줄 유지. `nest build`, 웹 `tsc`, 단위 테스트 7개 통과.

**리스크**
추천 한 번과 채팅 한 번이 각각 LLM 호출 한 번이라 무료 등급 분당 한도(429)에 자주 걸린다. 한도 초과 시 "1분쯤 뒤에 다시" 안내가 나온다.

**후속**
요청 속도 제한, 유료 등급 검토

**관련 문서**
[docs/plan/NAVIGATION_IA.md](../../plan/NAVIGATION_IA.md), [docs/API_DOCUMENTATION.md](../../API_DOCUMENTATION.md)
