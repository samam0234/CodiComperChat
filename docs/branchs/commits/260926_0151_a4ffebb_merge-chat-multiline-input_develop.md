# merge: feature/chat-multiline-input into develop (no-ff)

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/chat-multiline-input into develop (no-ff)` |
| Full SHA | `a4ffebb23172fa38cca308b3f87203a98452d02a` |
| Short SHA | `a4ffebb` |
| Branch | `develop` |
| Parent | `68f0a9a`, `a48522a` |
| Date | 2026-09-26T01:51:26+09:00 |

## 주 내용

- `feature/chat-multiline-input`을 `develop`에 `--no-ff`로 병합
- 채팅 입력창의 Shift+Enter 줄바꿈 / Enter 전송

## 상세

**배경**
사용자가 이 작업의 커밋과 병합을 함께 지시("하고 나서 커밋 작업하고 병합 ㄱㄱ")해서, 커밋 직후 병합했다.

**변경 범위**
apps/web(chat-input 컴포넌트, 캐릭터 채팅, 에이전트), `docs/plan/NAVIGATION_IA.md`, `docs/branchs/commits/`

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
