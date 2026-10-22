# merge: feature/required-persona into develop (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/required-persona into develop (no-ff)` |
| Full SHA | `a8f64d6c8fe8831cad361704d9ba6ec3966a1c53` |
| Short SHA | `a8f64d6` |
| Branch | `develop` |
| Parent | `425ff1a`, `5991b0e` |
| Date | 2026-09-25T23:52:46+09:00 |

## 주 내용

- `feature/required-persona`를 `develop`에 `--no-ff`로 병합
- 대화 전 프로필 캐릭터 선택을 필수로 하고 채팅을 로그인 전용으로 변경

## 상세

**배경**
세 작업(에이전트 LLM → 프로필 필수 선택 → 대답 추천)을 각 브랜치에서 끝낸 뒤 마지막에 순서대로 병합했다. 대화 전 프로필 캐릭터 선택을 필수로 하고 채팅을 로그인 전용으로 변경

**변경 범위**
apps/api(character-chat 컨트롤러·서비스), apps/web(채팅 화면·페이지, proxy, 마이페이지), 문서(API, NAVIGATION_IA)

**기술 포인트**
표준 병합 절차(`docs/guidance/branch-merge.md`)대로 `--no-ff` 사용. 세 브랜치는 앞 브랜치 위에 쌓은 것이라 앞에서부터 병합했다.

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
