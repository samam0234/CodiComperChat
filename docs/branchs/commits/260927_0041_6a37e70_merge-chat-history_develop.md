# merge: feature/chat-history into develop (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/chat-history into develop (no-ff)` |
| Full SHA | `6a37e70bc0dfb3ba289035aa8b8ab5303ffad8ae` |
| Short SHA | `6a37e70` |
| Branch | `develop` |
| Parent | `f5dd853`, `3d9aee4` |
| Date | 2026-09-27T00:41:17+09:00 |

## 주 내용

- `feature/chat-history`를 `develop`에 `--no-ff`로 병합
- 캐릭터 대화를 서버에 저장하고 대화 목록 페이지 추가

## 상세

**배경**
캐릭터 대화 기록·메모리·상태설정·설정 메뉴 작업을 네 브랜치(기록 → 메모리 → 상태설정 → 메뉴)로 나눠 커밋한 뒤, 사용자 지시("병합 ㄱㄱ")에 따라 앞에서부터 순서대로 병합했다.

**변경 범위**
apps/api(prisma, conversations 모듈, character-chat), apps/web(채팅 페이지, 대화 목록), 문서

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
