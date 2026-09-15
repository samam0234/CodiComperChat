# 앱 역할

정본: `CodiComperChat_project_plan.md` §7.2, §8. 상태: **세 앱 모두 라우트/화면 뼈대까지 구현됨. 서로 연결은 아직 없음.**

| 앱 | 스택 | 위치 | 역할 |
|----|------|------|------|
| web | Next.js 16 (React 19, App Router) | `apps/web/` | 홈, 세션(채팅), 캠페인 상태 패널, **캐릭터 공방(7단계, 운영자부터)**, 세션 로그북, 설정 |
| api | Nest.js 12 (TypeScript, ESM) | `apps/api/` | 인증, 유저, 캐릭터, 캠페인, 세션, 월드 스테이트, 권한, 로그. 웹이 유일하게 직접 치는 대상 |
| ai | FastAPI (Python 3.12) | `services/ai/` | `/infer` `/summarize` `/critique-test` `/train`(403 차단). Nest만 내부에서 호출 |

## 화면 지도 (계획서 §8, 구현 우선순위 순)

1. 홈 — 진행 중 캠페인, 캐릭터 선택
2. 세션(채팅) — 스트림, 선택지, 세션 종료
3. 캠페인 상태 패널 — 관계, 열린 훅, 지난 요약. 채팅 옆 또는 시트
4. 캐릭터 공방 — 7단계. 운영자부터
5. 세션 로그북 — 회차 목록과 짧은 아카이브
6. 설정 — 계정, 수위, 알림(후순위)

랜딩 마케팅 페이지는 v1 범위 밖 순서 — 제품이 한 캠페인을 끝낼 수 있게 된 다음이다.

## 현재 구현된 것 (2026-09-15)

**web**: 전역 셸(헤더 / 우측 드로어 / 푸터)과 11개 라우트의 빈 껍데기만 있다. 각 화면의 내용은 아직 없다. 라벨↔경로 매핑과 기획서 §8과의 대응은 [../plan/NAVIGATION_IA.md](../plan/NAVIGATION_IA.md) 참고.

**api**: 기획서 §13.1의 엔드포인트가 전부 라우팅되어 있고, `GET /health`만 실제 응답한다. 나머지는 501. 목록은 [../API_DOCUMENTATION.md](../API_DOCUMENTATION.md).

**ai**: 기획서 §13.2의 엔드포인트가 전부 라우팅되어 있고, `GET /health`만 실제 응답한다. `/infer` `/summarize` `/critique-test`는 501, `/train`은 v1 정책상 403이다.

**세 앱이 서로 연결되어 있지 않다.** 웹은 아직 api를 호출하지 않고(그래서 api에 CORS 설정도 없다), api는 아직 ai를 호출하지 않는다(그래서 ai에 서비스 토큰 인증도 없다). 연결은 기획서 §10의 5번(FastAPI `/infer` 스트림 + Nest 프록시) 단계에서 붙인다.

아직 없는 것: 세션(채팅) 화면, 캠페인 상태 패널 — 기획서 §10의 4번 단계에서 추가된다.

## 공방(Studio)은 별도 앱이 아니다

v1에서 캐릭터 공방은 `apps/web` 안의 운영자 전용 화면이다. 별도 콘솔 앱/포트를 새로 만들지 않는다 — 필요해지면(계획서 §9.3 "유저 창작 공방 오픈" 단계) 이 문서와 `plan/PROJECT_STRUCTURE.md`를 함께 갱신한다.

관련: [../guidance/web-frontend.md](../guidance/web-frontend.md), [../guidance/studio-workshop.md](../guidance/studio-workshop.md)
