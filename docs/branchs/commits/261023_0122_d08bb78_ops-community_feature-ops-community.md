# 오퍼레이션 커뮤니티 (캐릭터 세계 속 익명 게시판)

| 항목 | 내용 |
|------|------|
| Subject | `feat(ops): 오퍼레이션 커뮤니티 (캐릭터 세계 속 익명 게시판)` |
| Full SHA | `d08bb782ed6ce8626fbe3fb56c11457d02301394` |
| Short SHA | `d08bb78` |
| Branch | `feature/ops-community` |
| Parent | `a057f1e` (feature/ops-messages) |
| Date | 2026-10-23T01:22:39+09:00 |

## 주 내용

- 오퍼레이션 · 커뮤니티: 캐릭터 세계 속 가상 익명 게시판 (나에게만 보임)
- 새 글 불러오기(20 코레딧): 주민 글 3개 + 댓글, 이미 올라온 제목과 겹치지 않게
- 내 글 쓰기(10 코레딧): 익명(기본) 또는 내 주인공 실명, 주민 댓글 2~3개
- 주인공·지인(이 대화의 엑스트라)은 실명 언급 가능, 대화에 있었던 일만 사실로·소문은 추측 말투
- API GET /board, POST /board/refresh, POST /board/posts · AI /board-posts, /board-comments · 테이블 board_posts, board_comments

## 상세

**배경**
사용자 요청("커뮤니티 : 익명으로 게시판을 이용 … 익명으로 지정하거나 주인공 및 지인 캐릭터 관련해서 실명 거론이 가능")에 따라 만들었다. 범위는 질문으로 정했다: 실제 유저끼리가 아니라 캐릭터 세계 속 가상 게시판.

**변경 범위**
apps/api(operations·prisma), services/ai(operations·routes·fake_llm), apps/web(community 화면·메뉴·lib·actions), e2e/tests/operations.spec.ts, docs

**기술 포인트**
- 주민 글은 캐릭터 목소리가 아니라 여러 주민을 연기하는 작가 프롬프트(BOARD_SYSTEM) + 대답 추천의 세계 설명(_describe) 재사용
- 지인 = 이 대화에 적용한 엑스트라(최대 6명, 관계·소개 300자)
- AI 결과는 Nest에서 다시 길이를 자르고 빈 글쓴이는 '익명'
- 나에게만 보이는 게시판이라 신고·운영자 내리기는 두지 않음(다른 유저와 공유하지 않음)

**안 한 것**
내 댓글 달기, 글 지우기, 실제 gemma로 글 품질 확인

## 결과

**동작 확인**
- 타입 검사 api·web, oxlint, AI 서비스 불러오기
- e2e operations.spec 10개(커뮤니티 3개: 불러오기·익명/실명 글쓰기·길이 검사, 대화·유저마다 분리, 화면 흐름) 통과, 하이드레이션 경고 0

**리스크**
없음

**후속**
코디포토넷(화면만, 엔진 준비 중)

**관련 문서**
OPERATIONS.md, API_DOCUMENTATION, DATABASE, AI_MODEL_STRATEGY, NAVIGATION_IA
