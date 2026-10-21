# merge: feature/admin-console into develop (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/admin-console into develop (no-ff)` |
| Full SHA | `2e9770e6818869bd3272015e45821125f3ea60d9` |
| Short SHA | `2e9770e` |
| Branch | `develop` |
| Parent | `a8cb9d1`, `dd933f9` |
| Date | 2026-10-21T19:27:51+09:00 |

## 주 내용

- `feature/admin-console`를 `develop`에 `--no-ff`로 병합
- 저장소 루트에 운영자 전용 Next.js 콘솔(console/, 포트 3001)을 만들고 이용자 사이트의 운영 화면을 옮김. 콘솔용 통계·캐릭터 목록 API 추가

## 상세

**배경**
사용자 지시("메일 서비스는 실행하고 … 운영자 전용 콘솔서버도 만들어", 작업 뒤 병합·푸시)에 따라 메일 개발 서버 → 운영 콘솔 브랜치 순서로 병합했다.

**변경 범위**
apps/api/src/admin/, console/, apps/web/, e2e/, CI, docs/

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
없음

**관련 문서**
[docs/guidance/branch-merge.md](../../guidance/branch-merge.md)
