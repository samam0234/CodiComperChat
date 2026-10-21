# 인기 페이지 다듬기와 실제 인기 순위

| 항목 | 내용 |
|------|------|
| Subject | `feat(web): 인기 페이지 다듬기와 실제 인기 순위` |
| Full SHA | `e512ef116f531fad44144d657f85618d7879b99f` |
| Short SHA | `e512ef1` |
| Branch | `feature/popular-polish` |
| Parent | `916e4f4` (feature/theme-schedule) |
| Date | 2026-10-22T00:17:50+09:00 |

## 주 내용

- 인기 페이지를 홈과 같은 디자인(히어로 카드·그라데이션·캐릭터 카드 커버)으로 다듬음
- 실제 인기 순위: GET /characters/popular (대화한 사람 수 → 최근 7일 말 수 → 먼저 발행된 순)
- 요약 숫자(공개 캐릭터·대화한 사람·최근 7일 오간 말), 종류 탭(전체·공식·유저 제작), TOP 3 시상대(1위 가운데, 금·은·동 메달), 4위부터 줄 목록
- 인기 캠페인은 준비 중 카드로

## 상세

**배경**
사용자 요청("인기 페이지 관련해서도 좀 더 세련되게끔 지금 디자인을 유지한 채로")에 따라 다듬었다. 기존 화면은 '플레이 횟수 집계가 아직 없어 발행 순'이라 인기 순위가 아니었다.

**변경 범위**
apps/api/src/characters (popular), apps/web/app/popular, apps/web/lib/popular.ts, e2e/tests/popular.spec.ts, docs

**기술 포인트**
- 새 테이블 없이 기존 campaigns·messages로 센다(COUNT DISTINCT userId, 최근 7일 USER 메시지)
- 개인 정보는 싣지 않고 숫자만
- 카드 모양은 components/character-list.module.css를 그대로 가져다 써 홈과 똑같이 보이게
- 종류 탭은 서버에서 거른다. 이상한 ?kind 값은 전체로
- 라이트·다크·모바일 스크린샷으로 확인, 모바일은 TOP 3 그림을 16:9로 낮춤

**안 한 것**
순위 캐시(지금은 요청마다 집계), 인기 캠페인 목록

## 결과

**동작 확인**
- 타입 검사 api·web, oxlint
- e2e popular.spec 2개(순위·비공개 제외·탭) 통과

**리스크**
캐릭터·메시지가 아주 많아지면 매 요청 집계가 느려질 수 있다(그때 캐시나 집계 테이블)

**후속**
develop 병합

**관련 문서**
API_DOCUMENTATION, NAVIGATION_IA
