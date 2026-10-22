# 캐릭터 신고와 운영자 신고함(내리기·기각·복구) 추가

| 항목 | 내용 |
|------|------|
| Subject | `feat(studio): 캐릭터 신고와 운영자 신고함(내리기·기각·복구) 추가` |
| Full SHA | `2854137d0c84dbebb68c01204137fd206dd66164` |
| Short SHA | `2854137` |
| Branch | `feature/studio-reports` |
| Parent | `9fb2284` (feature/studio-samples) |
| Date | 2026-10-15T11:01:39+09:00 |

## 주 내용

- `CharacterReport`, `Character.takenDownAt·takedownReason`, 마이그레이션 `character_reports`
- `POST /characters/:id/report`(누구나), `GET /admin/reports`·`take-down`·`dismiss-reports`·`restore`(운영자만, `AdminGuard`)
- 내려간 캐릭터는 목록·상세·대화·메모리·상태설정·엑스트라·내 대화 목록에서 모두 빠짐, 공방에서 사유 안내, 복구 전 재발행 409
- 웹: 캐릭터 상세 신고 상자와 공식/내 캐릭터/유저 제작 배지, `/admin/reports`(운영자 전용), 마이페이지 운영자 링크, 공방 안내
- 시각 포맷 하이드레이션 불일치 수정(`lib/format-time.ts`)
- 신고 단위 테스트 8개, API 문서·NAVIGATION_IA·에이전트 기능 목록

## 상세

**배경**
사용자 요청("먼저 하면 좋은 것"). 앞서 "누구나 공개로 발행"으로 바뀌면서 홈에 검수 없는 캐릭터가 올라갈 수 있어 신고와 운영자 조치가 필요했다.

**변경 범위**
apps/api(prisma, reports 모듈, auth 가드, characters, conversations, studio), apps/web(상세, 신고 상자, 운영자 신고함, 공방, 시간 포맷), services/ai(assist), docs

**기술 포인트**
- 운영자 권한은 토큰이 아니라 DB의 `role`을 매번 읽는다(`AdminGuard`). 화면의 404는 편의이고 진짜 막는 곳은 API의 403이다.
- 내려감은 `published`를 건드리지 않고 `takenDownAt`으로 표시해, 복구하면 공개 범위·지식 파일·대화 기록이 그대로 돌아온다. 모든 캐릭터 조회가 `findOnePublished` 한 곳을 거쳐 규칙이 한 곳에 있다.
- 내려간 캐릭터는 만든 사람에게도 목록·대화에서 숨기지만, 공방에서는 사유를 보고 초안을 계속 볼 수 있다. 사유는 운영자가 필수로 써야 한다.
- 신고 남용 방지: 같은 캐릭터에 열린 신고 1건, 사람당 열린 신고 20건, 내 캐릭터 신고 불가, 보이지 않는 캐릭터는 404.
- 브라우저 시험이 잡은 실제 버그 2개를 고쳤다. (1) 서버 액션을 화살표 상수로 내보내 컴파일이 실패했다 — Server Actions는 `async function`이어야 한다. (2) 시각을 `toLocaleString("ko-KR")`로 그려 서버는 "AM", 브라우저는 "오전"이라 하이드레이션 불일치가 났다 — 클라이언트 컴포넌트의 날짜(신고함·이어하기·메모리 목록)를 한국 시간 공용 포맷터로 바꿨다.

**안 한 것**
- 신고자 알림, 신고 이력 보기, 이의 제기, 자동 필터링

## 결과

**동작 확인**
- 브라우저(임시 서버 + 실제 Ollama) 24개 통과:
  - 상세 배지·신고 상자(사유 선택 전 보내기 꺼짐, 기타는 내용 필수)·접수·중복 409
  - 주인은 공방 링크, 자기 캐릭터 신고 400, 일반 유저 /admin/reports 404·API 403
  - 운영자 마이페이지 링크·신고함, 사유 없이 내리면 거절
  - 내리면 홈·상세(신고자·주인 모두)·대화 404, 공방 안내·발행 불가·재발행 409·목록 "운영자가 내림"
  - 복구하면 목록·상세 복귀, 390px 가로 스크롤 없음, 브라우저 오류 없음
- 단위 테스트 83개, `typecheck:api`, oxlint, web `tsc --noEmit`

**리스크**
운영자가 한 명도 없으면 신고가 쌓이기만 한다. 운영자 지정은 `npm run user:role --workspace api -- <이메일> admin`이다.

**후속**
신고자·주인 알림

**관련 문서**
[docs/API_DOCUMENTATION.md](../../API_DOCUMENTATION.md), [docs/plan/NAVIGATION_IA.md](../../plan/NAVIGATION_IA.md)
