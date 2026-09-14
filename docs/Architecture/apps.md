# 앱 역할

정본: `CodiComperChat_project_plan.md` §7.2, §8. 상태: **코드 미착수.**

| 앱 | 스택 | 위치 | 역할 |
|----|------|------|------|
| web | Next.js (React, TSX) | `apps/web/` | 홈, 세션(채팅), 캠페인 상태 패널, **캐릭터 공방(7단계, 운영자부터)**, 세션 로그북, 설정 |
| api | Nest.js (TypeScript) | `apps/api/` | 인증, 유저, 캐릭터, 캠페인, 세션, 월드 스테이트, 권한, 로그. 웹이 유일하게 직접 치는 대상 |
| ai | FastAPI (Python) | `services/ai/` | `/infer` `/summarize` `/critique-test` `/train`(막힘). Nest만 내부에서 호출 |

## 화면 지도 (계획서 §8, 구현 우선순위 순)

1. 홈 — 진행 중 캠페인, 캐릭터 선택
2. 세션(채팅) — 스트림, 선택지, 세션 종료
3. 캠페인 상태 패널 — 관계, 열린 훅, 지난 요약. 채팅 옆 또는 시트
4. 캐릭터 공방 — 7단계. 운영자부터
5. 세션 로그북 — 회차 목록과 짧은 아카이브
6. 설정 — 계정, 수위, 알림(후순위)

랜딩 마케팅 페이지는 v1 범위 밖 순서 — 제품이 한 캠페인을 끝낼 수 있게 된 다음이다.

## 공방(Studio)은 별도 앱이 아니다

v1에서 캐릭터 공방은 `apps/web` 안의 운영자 전용 화면이다. 별도 콘솔 앱/포트를 새로 만들지 않는다 — 필요해지면(계획서 §9.3 "유저 창작 공방 오픈" 단계) 이 문서와 `plan/PROJECT_STRUCTURE.md`를 함께 갱신한다.

관련: [../guidance/web-frontend.md](../guidance/web-frontend.md), [../guidance/studio-workshop.md](../guidance/studio-workshop.md)
