# feature/character-list-web → develop 병합 (--no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/character-list-web into develop (no-ff)` |
| Full SHA | `7f1fa8ef679fb830ad2e90b8aa053519540312d7` |
| Short SHA | `7f1fa8e` |
| Branch | `develop` |
| Parent | `c905ded` `9f673f8` |
| Date | 2026-09-16 20:22:10 +0900 |

## 주 내용

- `feature/character-list-web`을 develop에 `--no-ff`로 병합
- 포함 커밋: `96c042e`(홈·인기 목록 렌더링), `9f673f8`(커밋 기록)
- 충돌 없음
- 이로써 **DB → API → 화면**이 처음으로 끝까지 이어졌다

## 상세

**배경**
캐릭터가 DB와 API에만 있고 화면에 없던 구간을 메운 작업이다. 다음 브랜치(상세 페이지, 챗봇 UI)가 이 컴포넌트를 전제로 하므로 먼저 통합했다.

**변경 범위**
`apps/web/components/character-list.*`, `apps/web/app/{page,popular/page,agents/page}.tsx`, 관련 CSS 모듈, `docs/plan/NAVIGATION_IA.md`

**기술 포인트**
- 병합 후 develop에서 홈·인기 양쪽이 같은 `CharacterList`를 공유한다. 상세 페이지 링크를 붙일 때도 이 한 곳만 고치면 된다.

**안 한 것**
- 원격 푸시 — 하지 않았다.

## 결과

**동작 확인**
develop 기준 `/`, `/popular`에서 유지성 카드 렌더링, `/agents`는 챗봇 가이드 문구만 확인.

**리스크**
`GET /characters` 응답에 비밀 필드가 남아 있다 — 다음 브랜치에서 처리한다.

**후속**
`feature/character-detail-api` → `feature/character-detail-web` → `feature/agent-chat`

**관련 문서**
`docs/plan/NAVIGATION_IA.md`, `docs/guidance/branch-merge.md`
