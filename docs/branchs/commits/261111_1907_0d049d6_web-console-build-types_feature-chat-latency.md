# 웹과 콘솔 빌드를 막던 타입 오류를 고치다

| 항목 | 내용 |
|------|------|
| Subject | `fix(web): 웹과 콘솔 빌드를 막던 타입 오류를 고치다` |
| Full SHA | `0d049d65b615b7f23013551af4b94240820d9150` |
| Short SHA | `0d049d6` |
| Branch | `feature/chat-latency` |
| Parent | `abed916` |
| Date | 2026-11-11 19:07:56 +0900 |

## 주 내용

develop에 들어간 두 커밋(3527c5f 웹소켓, 74b126a 문의)이 남긴 빌드 타입 오류를 고쳤다.

## 상세

### 배경

`npm run test:e2e`의 준비 단계가 웹 빌드에서 멈췄다. Vercel 웹 빌드도 같은 검사를 지난다.

### 변경 범위

- `character-chat.tsx`: 새 답 칸의 id를 상수 `openedId`로 받아 넣는다.
- `console/app/page.tsx`: `moderation` 타입에 `openInquiries?: number`.

### 기술 포인트

TS는 클로저 안에서 `let` 변수의 좁혀진 타입을 쓰지 않는다. 상수로 받으면 `number`로 남는다.

### 안 한 것

빌드가 막혀 드러나지 않던 e2e 실패 3개는 고치지 않았다(`docs/find_debug/2026-11-11.md` 2장).

## 결과

### 동작 확인

웹 `tsc --noEmit` 통과. e2e는 빌드를 지나 116 통과, 3 실패(이번 변경과 무관).

### 리스크

없음. 타입만 바꿨다.

### 후속

남은 e2e 실패 3개를 따로 고친다. Vercel 배포 기록에서 3527c5f 이후 실패가 있었는지 본다.

### 관련 문서

- `docs/find_debug/2026-11-11.md`
