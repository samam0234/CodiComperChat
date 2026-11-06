# 월드코퍼챗 DB와 세계관·플레이·이벤트 API 추가

| 항목 | 내용 |
|------|------|
| Subject | `feat(worlds): 월드코퍼챗 DB와 세계관·플레이·이벤트 API 추가` |
| Full SHA | `411afb56c352063445d96063662e233bbff9408f` |
| Short SHA | `411afb5` |
| Branch | `feature/world-core` |
| Parent | `bfbc025` |
| Date | 2026-11-06 14:58:16 +0900 |

## 주 내용

- 월드코퍼챗 DB(세계관·등장인물·장소·파트·장면 그림·플레이·메시지·이벤트·운영 설정)와 마이그레이션을 더했다
- 세계관 만들기·고치기·발행·그림·지도 API와 플레이(시작·진행·파트 넘기기·이벤트) API를 더했다
- 운영자 API(목록·상세·내리기·그림·지도 검수·이벤트 기록·운영 설정)를 더했다

## 상세

**배경**
사용자 요청(2026-11-06) 월드코퍼챗. 결정: 이벤트 보상은 하루 3회(운영 콘솔에서 바꿈), 이벤트는 서버가 확률로, 세계관은 누구나 공방처럼 만든다.

**변경 범위**
`apps/api/prisma/schema.prisma`, 마이그레이션 `20261106120000_world_copperchat`, `src/worlds/`(world.ts·worlds.service·world-play.service·world-settings.service·admin-worlds.*·controller·module·world.spec), `src/app.module.ts`, `src/studio/portrait.ts`(공용 그림 파서 `parseImage`).

**기술 포인트**
미니게임 결과는 전부 서버가 정한다. 사다리 가로줄·당첨 위치·제비 당첨·볼링 커브는 화면에 보내지 않고, 미로는 서버가 만든 미로를 이동 문자열로 다시 걸어 본다. 보상은 승리 20~50, 패배 5~10 코레딧이고, 하루 한도는 계정별 잠금(`pg_advisory_xact_lock`) 안에서 세어 동시 요청도 넘지 않는다. 이벤트를 두고 이야기를 이어 가면 그 이벤트는 끝난다. 진행자 턴은 기본 모델 사용량(`ModelsService.reserve`)을 쓰고 실패하면 돌려준다. 장면 그림·지도는 초상과 같은 자동 검수를 거친다. 파트 목표는 3턴마다 판정한다.

**안 한 것**
세계관 신고(ContentTarget에 WORLD만 더함, 화면은 아직), 플레이 대화의 운영자 열람.

## 결과

**동작 확인**
`world.spec.ts` 15개 포함 API 시험 226개 통과, 타입 검사·린트 통과. 마이그레이션 SQL은 스키마 차이로 만들었고 개발 DB에는 적용하지 않았다(e2e DB에서 적용 확인 예정).

**리스크**
메시지 기록은 최근 16개만 진행자에게 넘겨 긴 플레이는 앞일을 잊을 수 있다.

**후속**
웹 화면·운영 콘솔·e2e.

**관련 문서**
[OPERATIONS.md](../../plan/OPERATIONS.md)
