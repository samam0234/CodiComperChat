# 공방 AI 초상 후보 고르기와 추천 프로필 칸을 추가

| 항목 | 내용 |
|------|------|
| Subject | `feat(web): 공방 AI 초상 후보 고르기와 추천 프로필 칸을 추가` |
| Full SHA | `f8dbec22c6b3e0d58ea09224b43d9117170795bf` |
| Short SHA | `f8dbec2` |
| Branch | `feature/studio-portrait-preview` |
| Parent | `5dad22c` |
| Date | 2026-11-04 05:05:08 +0900 |

## 주 내용

- 공방 AI 초상을 바로 저장하지 않고 후보로 보여 주고, 고른 그림만 저장하게 했다
- 유저 캐릭터에 추천 프로필을 다는 칸을 공방에 넣었다

## 상세

**배경**
AI 초상은 만들자마자 저장돼 비교할 수 없었고, 추천 프로필은 공식 캐릭터만 쓸 수 있었다.

**변경 범위**
`apps/api/src/studio/`, `apps/web/app/studio/[id]/`, `apps/web/app/actions/studio.ts`, 문서, e2e. DB 변경은 없다.

**기술 포인트**
후보는 서버에 두지 않고 응답으로 돌려준다. 고르면 일반 업로드 길을 지나 서버가 다시 검수하므로, 브라우저가 보낸 그림을 믿지 않는다. 코레딧은 뽑을 때 빠진다. 추천 프로필은 `cardHash`에서 빼서 3턴 테스트를 무효로 만들지 않는다.

**안 한 것**
후보 서버 보관. 화면을 나가면 후보가 사라지고 코레딧은 돌아오지 않으며, 화면에 그렇게 적었다.

## 결과

**동작 확인**
공방 단위 시험 46개, `portrait-ai`·`studio`·`persona-recommend`·새 `studio-recommend` e2e 15개 통과. 가짜 그림 엔진 기준이며 실제 엔진으로 후보를 뽑아 보지는 않았다.

**리스크**
고를 때 검수를 한 번 더 해서 모델 호출이 늘고, 드물게 후보 때와 판정이 다를 수 있다.

**후속**
없음.

**관련 문서**
[studio-workshop.md](../../guidance/studio-workshop.md)
