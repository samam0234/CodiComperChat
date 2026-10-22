# merge: feature/account-delete into develop (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/account-delete into develop (no-ff)` |
| Full SHA | `9485dba57afe063e266835e130ad7bc0e5de0169` |
| Short SHA | `9485dba` |
| Branch | `develop` |
| Parent | `ba574e6`, `be92412` |
| Date | 2026-10-16T04:03:17+09:00 |

## 주 내용

- `feature/account-delete`를 `develop`에 `--no-ff`로 병합
- 회원 탈퇴, 탈퇴 계정 캐릭터가 공식으로 보이던 문제

## 상세

**배경**
사용자 지시("확인하지 못했거나 할 수 없는 것을 배포 제외하고 진행 → 테스트 → 작업별 커밋 → 병합하고 푸시")에 따라 토스 검증 → 한도 시험 수정 → SMTP 검증 → CI 재현 → 회원 탈퇴 → 시험 안정화 → 약관 보강 → 검수 평가 → CSP 보고 → 디자인 다듬기 브랜치 10개를 쌓인 순서대로 병합한다.

**변경 범위**
apps/api(account, billing, prisma), apps/web(설정), e2e

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
탈퇴 유예 검토

**관련 문서**
[docs/guidance/branch-merge.md](../../guidance/branch-merge.md)
