# 설정·저장한 대화·운영자·패널 화면 다듬기와 스크롤 경고 해결

| 항목 | 내용 |
|------|------|
| Subject | `style(web): 설정·저장한 대화·운영자·패널 화면 다듬기와 스크롤 경고 해결` |
| Full SHA | `be98771f4ed5cd844a2b2b6028f6665ce86db80d` |
| Short SHA | `be98771` |
| Branch | `feature/design-polish` |
| Parent | `127a9b2` (feature/csp-report) |
| Date | 2026-10-16T04:02:33+09:00 |

## 주 내용

- `layout.tsx`: `<html data-scroll-behavior="smooth">` — 디자인 개편에서 넣은 `scroll-behavior: smooth`에 대한 Next 경고 해결(화면을 옮길 때는 바로 맨 위로)
- 설정 화면: 칸마다 카드, 회원 탈퇴 칸은 경고색 테두리
- 다크 모드에서 바탕색과 같아 묻히던 큰 카드 9곳을 카드 색(`--surface`)으로 — 저장한 대화·신고함·이야기·엑스트라·대화 하위 화면·내 프로필·공방 일부
- 요금 화면 프로 칸 위에 최저 가격("4,900원부터")

## 상세

**배경**
사용자 요청("확인하지 못했거나 할 수 없는 것을 진행")의 디자인 후속(지난 기록의 "덜 쓰는 화면은 토큰으로만 바뀌어 덜 다듬어졌을 수 있다"). CI 재현 중 e2e 로그에 Next의 scroll-behavior 경고가 반복해서 찍힌 것도 함께 고친다.

**변경 범위**
apps/web(layout, settings, pricing, CSS 모듈 7개)

**기술 포인트**
- 큰 카드를 고르는 규칙: `background: var(--background)` + 테두리 + 둥글기 12px 이상 + 입력칸이 아님(height·font·resize 없음). 입력칸은 카드 안의 움푹한 칸이라 그대로 둔다.
- 공방 편집·신고함·운영자 화면·저장한 대화·대화 패널·설정·요금·마이페이지·약관을 라이트·다크로 캡처해 보고 고칠 곳을 정했다.

**안 한 것**
공방 편집 화면 구조 개편(색·버튼만 맞춤)

## 결과

**동작 확인**
- 라이트·다크 22장 캡처로 확인(고친 뒤 다시 캡처)
- 웹 e2e 47개 통과, scroll-behavior 경고 사라짐, oxlint·web tsc 통과

**리스크**
없음

**후속**
공방 편집 화면 구조 개편

**관련 문서**
[docs/plan/DESIGN.md](../../plan/DESIGN.md)
