# merge: develop into main (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: develop into develop (no-ff)` |
| Full SHA | `402bb07143fa7fde190dac19fe3f69fef4f03545` |
| Short SHA | `402bb07` |
| Branch | `main` |
| Parent | `6dbda51`, `97c3f87` |
| Date | 2026-10-22T23:39:03+09:00 |

## 주 내용

- `develop`를 `main`에 `--no-ff`로 병합
- develop 6개 커밋(.gitattributes 추가·보강 및 병합 기록)을 main에 합류

## 상세

**배경**
사용자 지시("main 병합도 하고 main 푸시도 ㄱㄱ")에 따라 develop을 main에 병합했다.

**변경 범위**
.gitattributes, docs/branchs

**기술 포인트**
`--no-ff` 사용. main에만 있던 병합 기록 문서 3개가 있어 docs/branchs/README.md만 충돌했고, develop 쪽을 받아 index.cjs로 목록을 다시 만들어 해결했다.

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
