# merge: feature/chat-settings-menu into develop (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/chat-settings-menu into develop (no-ff)` |
| Full SHA | `d1e14572072a2a99a490f0e24e87250857853948` |
| Short SHA | `d1e1457` |
| Branch | `develop` |
| Parent | `db2bb9f`, `7d4631c` |
| Date | 2026-09-27T00:41:27+09:00 |

## 주 내용

- `feature/chat-settings-menu`를 `develop`에 `--no-ff`로 병합
- 대화 상자 오른쪽 위 캐릭터 전용 설정 메뉴(⋮)

## 상세

**배경**
캐릭터 대화 기록·메모리·상태설정·설정 메뉴 작업을 네 브랜치(기록 → 메모리 → 상태설정 → 메뉴)로 나눠 커밋한 뒤, 사용자 지시("병합 ㄱㄱ")에 따라 앞에서부터 순서대로 병합했다.

**변경 범위**
apps/web(채팅 메뉴 컴포넌트, 스타일), 문서

**기술 포인트**
표준 병합 절차(`docs/guidance/branch-merge.md`)대로 `--no-ff` 사용. 네 브랜치는 앞 브랜치 위에 쌓은 것이라 앞에서부터 병합했다.

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
