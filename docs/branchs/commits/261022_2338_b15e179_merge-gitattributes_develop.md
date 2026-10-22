# merge: feature/gitattributes into develop (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/gitattributes into develop (no-ff)` |
| Full SHA | `b15e1795595cdeec845ee0dfc95ecaaf57539379` |
| Short SHA | `b15e179` |
| Branch | `develop` |
| Parent | `f1a2c07`, `303edcb` |
| Date | 2026-10-22T23:38:23+09:00 |

## 주 내용

- `feature/gitattributes`를 `develop`에 `--no-ff`로 병합
- .gitattributes 추가: 줄바꿈(text=auto, 저장소 LF·작업 사본은 기기 설정), 언어별·파일명별 규칙, 내장 diff 드라이버, 바이너리, GitHub 언어 통계 제외

## 상세

**배경**
사용자 지시("병합하고 푸시까지 ㄱㄱ")에 따라 feature/gitattributes를 develop에 병합했다. 앞선 두 커밋(최소 규칙, 언어·파일명 보강)이 함께 들어간다.

**변경 범위**
.gitattributes (루트)

**기술 포인트**
`--no-ff` 사용. develop에 없던 커밋 4개만 들어와 충돌 없음. 병합 전 .gitattributes 규칙을 git add --renormalize로 확인해 기존 파일 변경이 0개였다.

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
