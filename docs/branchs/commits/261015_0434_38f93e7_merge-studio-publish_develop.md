# merge: feature/studio-publish into develop (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/studio-publish into develop (no-ff)` |
| Full SHA | `38f93e7cdf38114b910e85841351060680d4e5e8` |
| Short SHA | `38f93e7` |
| Branch | `develop` |
| Parent | `d56364b`, `2affb79` |
| Date | 2026-10-15T04:34:06+09:00 |

## 주 내용

- `feature/studio-publish`를 `develop`에 `--no-ff`로 병합
- 운영자 전용 발행·내리기, 공방 캐릭터 지식 파일(studio-<초안 id>.json) 내보내기, /auth/me role, user:role 스크립트

## 상세

**배경**
사용자 지시("이제 제작 기능을 만들자 … 작업이 끝나면 커밋 작업 후 최종적으로 develop 병합하고 푸시해")에 따라 공방 브랜치 4개(studio-drafts → studio-test → studio-publish → studio-web)를 쌓인 순서대로 병합했다.

**변경 범위**
apps/api(studio, persona-rag 저장소, auth, scripts), docs/API_DOCUMENTATION.md, apps/api/data/personas/README.md

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
