# merge: feature/studio-drafts into develop (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/studio-drafts into develop (no-ff)` |
| Full SHA | `d512c35171a2144065e7216854db6d8d8fce7b1b` |
| Short SHA | `d512c35` |
| Branch | `develop` |
| Parent | `fe0c6f2`, `41e69b6` |
| Date | 2026-10-15T04:33:15+09:00 |

## 주 내용

- `feature/studio-drafts`를 `develop`에 `--no-ff`로 병합
- 캐릭터 공방 초안 모델(CharacterDraft·UserRole)과 카드 7층 검증·발행 준비 상태, 초안 CRUD API

## 상세

**배경**
사용자 지시("이제 제작 기능을 만들자 … 작업이 끝나면 커밋 작업 후 최종적으로 develop 병합하고 푸시해")에 따라 공방 브랜치 4개(studio-drafts → studio-test → studio-publish → studio-web)를 쌓인 순서대로 병합했다.

**변경 범위**
apps/api(prisma 스키마·마이그레이션, studio 모듈), docs/API_DOCUMENTATION.md, docs/branchs/commits/

**기술 포인트**
표준 병합 절차(`docs/guidance/branch-merge.md`)대로 `--no-ff` 사용. 브랜치가 앞 브랜치 위에 쌓여 있어 순서대로 합치면 충돌이 없다.

**안 한 것**
없음

## 결과

**동작 확인**
`git merge --no-ff` 정상 완료, 충돌 없음

**리스크**
없음

**후속**
다음 공방 브랜치 병합

**관련 문서**
[docs/guidance/branch-merge.md](../../guidance/branch-merge.md)
