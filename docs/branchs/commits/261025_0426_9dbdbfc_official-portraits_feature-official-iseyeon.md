# 유지성·이세연 공식 초상 (그림 엔진으로 제작)

| 항목 | 내용 |
|------|------|
| Subject | `feat(characters): 유지성·이세연 공식 초상 (그림 엔진으로 제작)` |
| Full SHA | `9dbdbfca160900192f54a24b01fc74e9ff6a53e2` |
| Short SHA | `9dbdbfc` |
| Branch | `feature/official-iseyeon` |
| Parent | `752b3f8` (develop) |
| Date | 2026-10-25T04:26:01+09:00 |

## 주 내용

- 유지성(23세 대학생 과외 선생님)·이세연(34세 회장 직속 비서) 공식 초상을 설치된 Stable Diffusion WebUI(Animagine XL 4.0)로 제작
- 캐릭터 설정을 영어 태그로 옮겨 시드 3개씩 후보를 그리고 눈으로 골랐다 — 유지성: 책장 앞, 셔츠·카디건, 다정하지만 조금 지친 얼굴 / 이세연: 도시가 보이는 창가, 검은 정장·낮은 포니테일, 차분한 표정
- apps/api/prisma/assets/portraits/에 512px WebP(약 35KB, 초상 상한 150KB 이하)로 두고, 시드가 초상이 비어 있는 공식 캐릭터에만 넣음

## 상세

**배경**
사용자 요청("유지성하고 이세연 전용 캐릭터 사진을 넣어줄 수 있니? 가능하면 여기 장착된 webUI 활용").

**변경 범위**
apps/api/prisma/seed.mjs, apps/api/prisma/assets/portraits/

**기술 포인트**
- 프롬프트는 성인 태그(adult man/woman:1.2)·safe·전체 이용가 부정 프롬프트(코디포토넷과 같은 것)로 만듦
- 개발 DB에 시드 실행 → GET /characters/:id/portrait 200 image/webp 확인
- 운영자가 콘솔에서 바꾼 초상을 지키려고 portrait가 null일 때만 갱신

**안 한 것**
초상 자동 검수(gemma)는 돌리지 않음 — 공식 캐릭터라 눈으로 확인

## 결과

**동작 확인**
- 개발 DB 반영, API로 초상 본문 확인

**리스크**
없음

**후속**
공방 외형 단계 AI 초상 만들기(25 코레딧)

**관련 문서**
(다음 커밋에서 문서 반영)
