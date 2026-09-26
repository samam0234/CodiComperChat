# merge: fix/api-stale-dist into develop (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: fix/api-stale-dist into develop (no-ff)` |
| Full SHA | `25a56bc0be8df3f8019df4a2b50e7ebe05ced730` |
| Short SHA | `25a56bc` |
| Branch | `develop` |
| Parent | `69f2b17`, `05a2fc8` |
| Date | 2026-09-27T01:13:26+09:00 |

## 주 내용

- `fix/api-stale-dist`를 `develop`에 `--no-ff`로 병합
- dev 서버가 `dist/main` 없음으로 죽고 안 살아나는 빌드 설정 수정

## 상세

**배경**
사용자 지시("커밋 작업 ㄱㄱ … 최종 커밋에서는 병합으로 마무리 ㄱㄱ")에 따라 커밋 후 병합했다.

**변경 범위**
apps/api(`tsconfig.build.json`, `package.json`), 루트 `package.json`·`.gitignore`, `docs/repeater/`, `docs/branchs/commits/`

**기술 포인트**
표준 병합 절차(`docs/guidance/branch-merge.md`)대로 `--no-ff` 사용.

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
