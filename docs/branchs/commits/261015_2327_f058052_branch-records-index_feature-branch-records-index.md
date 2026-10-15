# 커밋 기록 목록에 빠진 기록 87건 추가

| 항목 | 내용 |
|------|------|
| Subject | `docs(branchs): 커밋 기록 목록에 빠진 기록 87건 추가` |
| Full SHA | `f05805296d2b2b0688d81e5f3226b913e2ecc653` |
| Short SHA | `f058052` |
| Branch | `feature/branch-records-index` |
| Parent | `4506a0a` (feature/web-redesign) |
| Date | 2026-10-15T23:27:19+09:00 |

## 주 내용

- `docs/branchs/README.md` 커밋 기록 목록에 빠져 있던 87건을 날짜순으로 추가
- 기록 표(Subject·Short SHA·Branch·Date)에서 읽고, 표가 없는 옛 형식은 파일 이름과 제목에서 채움

## 상세

**배경**
규칙(SKILL.md §4, README 끝의 안내)은 커밋 기록을 만들 때마다 목록에 한 줄씩 넣게 되어 있는데, 2026-09-26 이후 기록은 commits/에만 쌓이고 목록에는 들어가지 않았다. 이번 병합 전에 확인하다 발견했다.

**변경 범위**
docs/branchs/README.md

**기술 포인트**
- 처음 채울 때 옛 형식 기록 48건이 빈칸으로 들어가 바로 다시 채웠다(파일 이름의 날짜·SHA·브랜치, 본문 제목).

**안 한 것**
없음

## 결과

**동작 확인**
- 목록의 빈칸 0건, 목록이 commits/의 모든 파일을 가리킴

**리스크**
없음

**후속**
앞으로 기록을 만들 때 목록에도 함께 추가

**관련 문서**
[docs/branchs/README.md](../README.md)
