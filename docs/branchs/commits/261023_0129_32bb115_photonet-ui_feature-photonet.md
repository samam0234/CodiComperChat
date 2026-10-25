# 코디포토넷 창 (엔진 준비 중)

| 항목 | 내용 |
|------|------|
| Subject | `feat(ops): 코디포토넷 창 (엔진 준비 중)` |
| Full SHA | `32bb1156c11509d5acfcb30b380fe77590d8d8a2` |
| Short SHA | `32bb115` |
| Branch | `feature/photonet` |
| Parent | `ed51f2c` (feature/ops-community) |
| Date | 2026-10-23T01:29:54+09:00 |

## 주 내용

- 코디포토넷: 대화 입력창 바로 위 왼쪽 버튼으로 여는 "장면을 그림으로" 창
- 창: 장면 설명(지금 장면으로 채우기), 화풍·비율 고르기, 값 50 코레딧·잔액, 만든 그림 자리
- 엔진은 준비 중: 만들기 버튼 잠금, 서버는 입력 검사 뒤 503(코레딧 빼지 않음)
- API GET/POST /characters/:id/chat/ops/photonet, PHOTONET_READY 상수
- 일기 카드의 줄 노트를 본문에만 긋도록 다듬음

## 상세

**배경**
사용자 요청("코디포토넷 : 대화창에서 입력창 바로 위 왼쪽에 보면 버튼이 있는데 이미지를 만드는 기능")에 따라 만들었다. 엔진은 질문으로 정했다: 화면·흐름만, 엔진은 준비 중(지금 로컬 모델은 그림을 만들지 못한다).

**변경 범위**
apps/api(operations), apps/web(photonet 창·ops-bar·character-chat·lib·actions·ops.module.css), e2e/tests/operations.spec.ts, docs

**기술 포인트**
- 브라우저 기본 <dialog>(showModal)로 포커스 가두기·Esc·바깥 클릭 닫기
- 창을 열 때만 상태를 불러온다(서버 액션 loadPhotonet)
- 준비 중이면 대화 확인(409)과 입력 검사(400) 뒤 503 — 코레딧을 빼기 전에 막는다
- 엔진 연결 지점: PHOTONET_READY + services/ai 생성 경로 + charged('photonet')

**안 한 것**
실제 그림 생성 엔진, 그림 저장 테이블·보관 위치

## 결과

**동작 확인**
- 타입 검사 api·web, oxlint
- e2e operations.spec 12개 + chat·commands 포함 20개 통과, 하이드레이션 경고 0
- 오퍼레이션 메뉴·코디포토넷 창·심리 탐구·일기·메시지·커뮤니티 화면을 라이트·다크 스크린샷으로 확인

**리스크**
없음

**후속**
develop 병합(사용자 확인 후)

**관련 문서**
OPERATIONS.md, API_DOCUMENTATION, NAVIGATION_IA
