# 채팅 입력창에서 Shift+Enter로 줄바꿈하고 Enter로 전송

| 항목 | 내용 |
|------|------|
| Subject | `feat(web): 채팅 입력창에서 Shift+Enter로 줄바꿈하고 Enter로 전송` |
| Full SHA | `de1dfd03260e32e37fa0df0bd3ada3a514636a1b` |
| Short SHA | `de1dfd0` |
| Branch | `feature/chat-multiline-input` |
| Parent | `68f0a9a` (develop) |
| Date | 2026-09-26T01:51:06+09:00 |

## 주 내용

- 공용 `components/chat-input.tsx`(textarea) 신규: Enter = 전송, Shift+Enter = 줄바꿈
- 캐릭터 채팅과 에이전트 입력창을 이 컴포넌트로 교체
- 한글 조합 중 Enter는 전송하지 않고, 터치 기기에서는 Enter를 줄바꿈으로 둠
- 내용에 맞춰 커지다 6줄에서 멈추고 안에서 스크롤, 보내면 한 줄로 복귀
- 두 화면의 중복 `.input` 스타일을 `chat-input.module.css`로 통합

## 상세

**배경**
사용자가 Shift+Enter로 입력창에서 줄바꿈을 넣을 수 있게 해 달라고 요청했다. 기존 입력창은 한 줄짜리 `<input>`이라 줄바꿈 자체가 불가능했다. 메시지 표시 쪽은 이미 `white-space: pre-wrap`이라 입력만 바꾸면 됐다.

**변경 범위**
apps/web(`chat-input` 컴포넌트·CSS, 캐릭터 채팅, 에이전트), 문서(`NAVIGATION_IA.md`). API·AI는 변경 없음 — 줄바꿈은 기존 message 문자열에 `\n`으로 그대로 실린다.

**기술 포인트**
- 한글 IME는 글자를 조합하는 중에 Enter를 누르면 조합 확정이라, 전송하면 마지막 글자가 중복되거나 잘려 나간다. `nativeEvent.isComposing`과 `keyCode === 229`로 조합 중 Enter를 걸러낸다.
- 화면 키보드에는 Shift가 없어 줄바꿈할 방법이 사라지므로, `pointer: coarse`인 기기에서는 Enter를 줄바꿈으로 두고 "보내기" 버튼으로 전송한다.
- 높이는 `scrollHeight`로 계산하되 비어 있을 때는 계산하지 않는다. 좁은 화면에서 안내 문구가 두 줄로 접히면 `scrollHeight`가 커져 입력창이 66px로 시작하던 결함을 테스트에서 발견해 고쳤다.
- 입력창이 커지면 형제 버튼이 함께 늘어나 보기 흉해지므로 폼을 `align-items: flex-end`로, 보내기 버튼을 `height: 44px`로 고정했다.

**안 한 것**
- Ctrl+Enter 등 다른 전송 단축키, 입력 중 초안 저장
- 대답 추천이 여러 줄을 채울 때의 별도 처리(입력창이 자동으로 커지는 것으로 충분)

## 결과

**동작 확인**
실제 Chrome(playwright-core)으로 17개 시나리오 통과: textarea 렌더, Shift+Enter로 줄바꿈(빈 줄 포함)·전송 안 됨, 줄이 늘면 입력창이 커짐(47px → 108px), 보내기 버튼 44px·아래 정렬, 조합 중 Enter는 전송 안 됨(내용 유지), Enter로 전송하고 요청 message에 줄바꿈이 그대로 실림, 전송 뒤 한 줄로 복귀, 내 말풍선에 줄바꿈 표시, 12줄에서 150px로 멈추고 내부 스크롤, 에이전트 화면 동일, 터치 기기(coarse)에서 Enter는 줄바꿈이고 전송 안 됨. 콘솔 오류 없음. 웹 `tsc`와 프로덕션 빌드 통과.

**리스크**
- 실제 한글 IME 조합을 브라우저 자동화로 재현할 수는 없어 `isComposing: true`인 keydown 이벤트를 직접 주입해 검증했다. 실제 키보드로 한글을 치며 Enter를 눌러 보는 확인은 사용자 몫이다.
- 터치 기기에서 Enter로 전송하던 습관이 있는 사용자는 처음에 줄바꿈이 돼 당황할 수 있다.

**후속**
없음

**관련 문서**
[docs/plan/NAVIGATION_IA.md](../../plan/NAVIGATION_IA.md)
