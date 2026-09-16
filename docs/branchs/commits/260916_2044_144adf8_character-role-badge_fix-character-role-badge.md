# 캐릭터 배지를 role 값 대신 '공식'으로 표시

| 항목 | 내용 |
|------|------|
| Subject | `fix(web): 캐릭터 배지를 role 값 대신 '공식'으로 표시` |
| Full SHA | `144adf82e2203711c0aa1b209fc4067d5eb907d4` |
| Short SHA | `144adf8` |
| Branch | `fix/character-role-badge` |
| Parent | `deaf2cd` |
| Date | 2026-09-16 20:44:47 +0900 |

## 주 내용

- `apps/web/app/characters/[id]/page.tsx`, `apps/web/components/character-list.tsx`의 role 배지를 `{character.role}` → `공식` 고정 문자열로 변경

## 상세

**배경**
사용자가 캐릭터 카드/상세 배지에 "guide"가 노출되는 걸 지적했다. `role`은 `services/ai/app/schemas/context.py`의 `CampaignRole`(companion/rival/client/guide/wildcard) — 캐릭터가 캠페인에서 맡는 역할을 가리키는 내부 분류값이다. 지금은 공식 캐릭터가 유지성 1명뿐이라 "역할이 뭔지"보다 "이게 공식 캐릭터"라는 신호가 우선이다.

**변경 범위**
`apps/web/app/characters/[id]/page.tsx`, `apps/web/components/character-list.tsx` (각 1줄)

**기술 포인트**
- `role` 필드는 fetch 타입과 API 응답에는 그대로 남겨 뒀다. 화면에서만 안 쓴다. 계획서 §7.6이 캐릭터 역할을 companion/rival/client/guide/wildcard로 구분하고 있고, `/agents` 원래 플레이스홀더 문구도 "역할별 필터"를 언급했으므로 나중에 실제로 쓰일 값이다.

**안 한 것**
- 역할별 필터 UI — role을 쓸 일이 생기기 전까지는 만들지 않는다.

## 결과

**동작 확인**
- `npx tsc --noEmit` 통과
- 홈·상세 페이지 HTML에서 "guide" 미검출, "공식" 검출

**리스크**
없음. 표시 전용 변경.

**후속**
공식 캐릭터가 여러 명이 되고 역할 구분이 필요해지면 배지를 role 기반으로 되돌리거나 별도 UI 요소로 분리.

**관련 문서**
`docs/plan/CHARACTERS.md`, `services/ai/app/schemas/context.py`
