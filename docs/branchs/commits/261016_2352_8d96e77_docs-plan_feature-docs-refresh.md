# 스택·DB·구조·화면 지도를 실제 구현에 맞춤

| 항목 | 내용 |
|------|------|
| Subject | `docs(plan): 스택·DB·구조·화면 지도를 실제 구현에 맞춤` |
| Full SHA | `8d96e778e89a182cde1085c6de61a98920379252` |
| Short SHA | `8d96e77` |
| Branch | `feature/docs-refresh` |
| Parent | `4c238da` (feature/ai-env-example) |
| Date | 2026-10-16T23:52:39+09:00 |

## 주 내용

- `docs/plan/CURRENT_STACK.md`: "구현 시작됨" 단계 문구를 걷어 내고, 구현하며 정한 것(인증·이메일 인증·토큰 세대·메일·탈퇴·LLM·AI 대기열·요청 한도·요금 등급·결제·가격·초상 검수·RAG·CSP·디자인·테스트·CI)을 표로. e2e 포트, 계획서 API 경계와의 차이, 열린 항목, 갱신 체크리스트에 환경변수 추가
- `docs/plan/DATABASE.md`: "스키마 미확정" → 실제 테이블 15개(무엇·지워질 때), 계획서 데이터스토어 대비 지금(Redis·벡터DB·오브젝트 스토리지를 쓰지 않는 이유), 비공개 칸, 마이그레이션 명령. 계획서의 카드 타입 원안은 남기고 실제 카드 정본 위치를 밝힘
- `docs/plan/PROJECT_STRUCTURE.md`: web·api·ai·e2e 실제 폴더 구조
- `docs/plan/NAVIGATION_IA.md`: 헤더 오른쪽 버튼, 드로어 "요금 안내", 계정(이메일 인증·비밀번호 찾기·탈퇴), 요금·결제 화면, 운영자 화면, §8 대응표(세션·상태 패널이 이제 있음)

## 상세

**배경**
사용자 요청("커밋 후 문서 업데이트 — 추가해야 할 방식의 문서를 보고 어떤 부분을 추가·수정할지 생각해 업데이트"). docs/의 많은 문서가 2026-09-15 뼈대 단계("세 앱 모두 뼈대만", "DB 미착수", "앱끼리 연결 없음", "전부 501")에 머물러 실제와 크게 어긋나 있었다. SKILL.md §7은 구현이 바뀌면 CURRENT_STACK을 가장 먼저 고치라고 한다.

**변경 범위**
docs/plan(CURRENT_STACK, DATABASE, PROJECT_STRUCTURE, NAVIGATION_IA)

**기술 포인트**
- 사실은 코드에서 뽑아 썼다: 컨트롤러를 읽어 실제 경로 목록(운영자 경로 표시), schema.prisma의 모델·칸, 웹 page.tsx 목록, 코드가 읽는 환경변수.
- 계획서와 다른 점은 숨기지 않고 "계획서 반영 여부 확인 필요"로 적었다: `/campaigns/*`는 501이고 실제 대화는 `/characters/:id/chat*`, 공방이 운영자 전용이 아니라 일반 유저에게 열림, LoreEntry 테이블 대신 카드 JSON·지식 파일.
- 원본 기획서(루트 CodiComperChat_project_plan.md)는 고치지 않았다(§0).

**안 한 것**
계획서 원본 반영(사용자 승인 필요)

## 결과

**동작 확인**
- 문서 속 경로·테이블·포트·명령을 코드와 대조(컨트롤러 목록, schema.prisma, package.json 스크립트, e2e/env.mjs)

**리스크**
없음

**후속**
Architecture·guidance 문서 갱신(같은 브랜치)

**관련 문서**
[docs/plan/CURRENT_STACK.md](../../plan/CURRENT_STACK.md)
