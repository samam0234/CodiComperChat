# merge: feature/adult-guard into develop (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/adult-guard into develop (no-ff)` |
| Full SHA | `07692f95fc6c8d05a4e4b5432367be851224f119` |
| Short SHA | `07692f9` |
| Branch | `develop` |
| Parent | `ec96725`, `c0f47d8` |
| Date | 2026-10-24T23:01:58+09:00 |

## 주 내용

- `feature/adult-guard`를 `develop`에 `--no-ff`로 병합
- 성인 그림 미성년자·실사 원천 차단, 거짓 정보 책임 고지

## 상세

**배경**
사용자 지시("병합")에 따라 쌓여 있던 feature 브랜치를 순서대로 병합했다. README 목록의 충돌은 목록 재생성으로 풀었다.

**변경 범위**
services/ai(photonet, moderation), apps/web(약관·성인 확인 문구), e2e, docs

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
webtoon 병합

**관련 문서**
[docs/guidance/branch-merge.md](../../guidance/branch-merge.md)
