# merge: feature/legal-update into develop (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/legal-update into develop (no-ff)` |
| Full SHA | `a60e42cc6015078fb80cc4cd54d35e2280beb21d` |
| Short SHA | `a60e42c` |
| Branch | `develop` |
| Parent | `8df8a5a`, `9a4c588` |
| Date | 2026-10-16T04:03:20+09:00 |

## 주 내용

- `feature/legal-update`를 `develop`에 `--no-ff`로 병합
- 약관·개인정보처리방침을 실제 동작에 맞춤, 결제 전 환불 안내·동의

## 상세

**배경**
사용자 지시("확인하지 못했거나 할 수 없는 것을 배포 제외하고 진행 → 테스트 → 작업별 커밋 → 병합하고 푸시")에 따라 토스 검증 → 한도 시험 수정 → SMTP 검증 → CI 재현 → 회원 탈퇴 → 시험 안정화 → 약관 보강 → 검수 평가 → CSP 보고 → 디자인 다듬기 브랜치 10개를 쌓인 순서대로 병합한다.

**변경 범위**
apps/web(terms, privacy, pricing), e2e

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
법률 검토

**관련 문서**
[docs/guidance/branch-merge.md](../../guidance/branch-merge.md)
