# 캐릭터 흉상 초상 이미지(올리기·미리보기·목록/상세/채팅 표시) 추가

| 항목 | 내용 |
|------|------|
| Subject | `feat(studio): 캐릭터 흉상 초상 이미지(올리기·미리보기·목록/상세/채팅 표시) 추가` |
| Full SHA | `332be4809e36600902e40638a10545ff9510ae74` |
| Short SHA | `332be48` |
| Branch | `feature/studio-portrait` |
| Parent | `d45c4d1` (feature/campaign-state) |
| Date | 2026-10-15T11:23:35+09:00 |

## 주 내용

- `Character`·`CharacterDraft`에 `portrait`(Bytes)·`portraitMime` (마이그레이션 `character_portrait`)
- `PUT·DELETE·GET /studio/characters/:id/portrait`, `GET /characters/:id/portrait`
- `studio/portrait.ts`: 형식·크기·파일 첫 바이트 검사, 단위 테스트 4개
- 목록 응답에 `official`·`portraitMime`·`updatedAt`
- 웹: 외형 단계 초상 업로더(자르기·줄이기), 공방 미리보기, 홈 목록·상세·채팅 머리 아바타, 이미지 중계 라우트
- API 문서·NAVIGATION_IA·에이전트 기능 목록

## 상세

**배경**
기획서 §6.2 "외형 — 채팅 옆에 붙을 흉상 초상이 우선. 전신 일러스트 공장은 v1 범위 밖". 사용자 요청("기획서에 있고 아직 없는 기능들"). 이미지 생성 모델이 없어 AI가 그려 주는 기능은 만들 수 없고, 유저가 올린 그림을 쓰는 방식으로 했다(미리 안내함).

**변경 범위**
apps/api(prisma, main.ts, characters, studio), apps/web(공방, 목록·상세·채팅, 이미지 중계, 아바타 컴포넌트), services/ai(assist), docs

**기술 포인트**
- 서버는 브라우저를 믿지 않는다. `Content-Type`만 믿으면 아무 파일이나 그림으로 올릴 수 있어, 파일 첫 바이트(PNG·JPEG·WebP 매직 넘버)가 선언한 형식과 맞는지 보고, 150KB 이하만 받는다. svg·gif는 스크립트를 품을 수 있어 아예 받지 않는다.
- 이미지를 base64 JSON으로 부풀리지 않고 raw 본문으로 받는다(`useBodyParser('raw')`, 300KB 상한 → 초과는 413).
- 내보낼 때도 방어한다: `nosniff`와 `Content-Security-Policy: sandbox`로 그림 안의 스크립트가 실행되지 않게 한다.
- 비공개 캐릭터의 초상은 만든 사람만 본다. `<img>`는 Authorization 헤더를 못 붙이므로 웹이 로그인 쿠키의 토큰을 꺼내 Nest에 붙이는 중계 라우트를 둔다. 공개·링크 공개는 잠깐 캐시하고 비공개는 캐시를 막는다. 목록 응답에는 이미지 본문을 싣지 않고 있는지(`portraitMime`)만 알린다.
- 초상은 카드(지문)와 따로 저장해, 바꿔도 3턴 테스트를 다시 할 필요가 없고 발행 중이면 캐릭터에 바로 반영된다.
- 브라우저에서 정사각형(320px)으로 자르고(얼굴이 위쪽인 흉상이 많아 위쪽을 더 남김) webp 120KB 안팎으로 줄인다. 1600×900 시험 그림이 320px 17KB가 됐다.
- 시험 중 발견: 그림이 아닌 파일을 올리면 브라우저의 영어 오류("The source image could not be decoded.")가 그대로 보여 한국어 안내로 고쳤다. 홈 목록 카드가 모든 캐릭터에 "공식"을 붙이던 것도 공식/유저 제작으로 구분했다.

**안 한 것**
- AI로 초상 그려 주기(이미지 생성 모델 없음), 이미지 내용 자동 검수(신고·내리기로 대신)

## 결과

**동작 확인**
- 브라우저 + API(임시 서버) 23개 통과:
  - 초상 없음 상태, 그림이 아닌 파일 한국어 거절, 올리면 미리보기가 실제로 로드(320px)·오른쪽 미리보기에 표시, 서버 저장 webp 17KB
  - API: 그림인 척하는 글 파일 400, gif 400, 150KB 초과 400, 300KB 초과 413, 남의 초안 404
  - 공개 발행 후 홈 목록·상세·채팅 머리에 초상, "유저 제작" 배지
  - 비공개로 바꾸면 남·비로그인은 404, 웹 중계도 404, 주인은 200, 공개에서는 이미지와 보안 헤더
  - 지우면 발행된 캐릭터에서도 지워지고 홈 카드는 이니셜로 대체, 390px 가로 스크롤 없음, 오류·하이드레이션 경고 없음
- 단위 테스트 103개, `typecheck:api`, oxlint, web `tsc --noEmit`

**리스크**
부적절한 그림이 올라올 수 있다. 자동 검수가 없어 신고·운영자 내리기에 의존한다. 이미지가 DB에 들어가 캐릭터가 많아지면 파일 저장소(S3 등)로 옮기는 편이 낫다(캐릭터당 150KB 이하라 지금은 문제 없음).

**후속**
이미지 저장소 분리, AI 초상 생성

**관련 문서**
[docs/API_DOCUMENTATION.md](../../API_DOCUMENTATION.md), [docs/plan/NAVIGATION_IA.md](../../plan/NAVIGATION_IA.md)
