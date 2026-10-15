# merge: feature/branch-records-index into develop (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/branch-records-index into develop (no-ff)` |
| Full SHA | `d064bdb388ba9f051942d9801d60e40d3ee933d7` |
| Short SHA | `d064bdb` |
| Branch | `develop` |
| Parent | `1b81485`, `01cd71a` |
| Date | 2026-10-15T23:28:36+09:00 |

## 주 내용

- `feature/branch-records-index`를 `develop`에 `--no-ff`로 병합
- 커밋 기록 목록 정리

## 상세

**배경**
사용자 지시("아직 안 된 것 중 배포 빼고 전부 진행 → 디자인 개편 → 커밋 → 병합하고 푸시")에 따라 이메일 인증 → 이미지 검수 → 결제 → 공유 한도 → CI → 엄격 CSP → 디자인 개편 → 기록 목록 브랜치 8개를 쌓인 순서대로 병합한다.

**변경 범위**
docs/branchs/README.md

**기술 포인트**
표준 병합 절차(`docs/guidance/branch-merge.md`)대로 `--no-ff` 사용. 브랜치가 앞 브랜치 위에 쌓여 있어 순서대로 합치면 충돌이 없다.

**안 한 것**
없음

## 결과

**동작 확인**
`git merge --no-ff` 완료. docs/branchs/README.md 목록이 충돌(앞 병합 기록들이 목록에 줄을 더한 것과 이 브랜치의 목록 정리가 겹침) → 브랜치 쪽 표를 기준으로 하고 빠진 병합 기록 7줄을 다시 채워 해결. 목록의 빠진 기록·중복 0건 확인

**리스크**
없음

**후속**
없음

**관련 문서**
[docs/guidance/branch-merge.md](../../guidance/branch-merge.md)
