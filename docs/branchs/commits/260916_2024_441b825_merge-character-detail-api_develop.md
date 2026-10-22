# feature/character-detail-api → develop 병합 (--no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/character-detail-api into develop (no-ff)` |
| Full SHA | `441b8256e116f683596910885de90973a80981d1` |
| Short SHA | `441b825` |
| Branch | `develop` |
| Parent | `03b05f0` `54157ea` |
| Date | 2026-09-16 20:24:22 +0900 |

## 주 내용

- `feature/character-detail-api`를 develop에 `--no-ff`로 병합
- 포함 커밋: `66096b0`(상세 조회·비밀 필드 제외), `54157ea`(커밋 기록)
- 충돌 없음

## 상세

**배경**
웹 상세 페이지가 소비할 엔드포인트라 먼저 통합했다. 동시에 `43d501b` 기록에 "후속 필수"로 남겨 둔 비밀 노출 건이 이 병합으로 해소됐다.

**변경 범위**
`apps/api/src/characters/*`, `docs/plan/CURRENT_STACK.md`

**기술 포인트**
- 이 병합 이후 develop의 공개 캐릭터 API는 화이트리스트 기반이다. 스키마에 필드를 추가해도 명시하지 않으면 밖으로 나가지 않는다.

**안 한 것**
- 원격 푸시 — 하지 않았다.

## 결과

**동작 확인**
develop 기준 `npm run build --workspace api` 통과, `GET /characters/:id` 200 / 없는 id 404 확인.

**리스크**
`/characters/:id`가 계획서 §13.1 목록 밖 경로라는 점은 `66096b0` 기록에 남겨 두었다.

**후속**
`feature/character-detail-web` — 상세 페이지 구현

**관련 문서**
`docs/plan/CURRENT_STACK.md`, `docs/guidance/branch-merge.md`
