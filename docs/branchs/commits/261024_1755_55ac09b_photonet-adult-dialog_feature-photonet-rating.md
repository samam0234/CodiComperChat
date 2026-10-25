# 성인 확인을 열림 상자로 바로 하기

| 항목 | 내용 |
|------|------|
| Subject | `feat(photonet): 성인 확인을 열림 상자로 바로 하기` |
| Full SHA | `55ac09b8db576841b19fe3874b76dc594ade49dd` |
| Short SHA | `55ac09b` |
| Branch | `feature/photonet-rating` |
| Parent | `9dce24e` (feature/photonet-scene) |
| Date | 2026-10-24T17:55:22+09:00 |

## 주 내용

- 코디포토넷에서 성인 버튼을 누르면 설정 페이지로 가지 않고 열림 상자(성인 확인)가 떠서 생년월일·동의를 바로 받음
- 확인이 끝나면 상태를 다시 읽고 곧바로 성인 모드로 전환(실사풍을 골라 뒀으면 애니메이션으로)
- 이메일 미인증이면 마이페이지 링크, 만 19세 미만이면 이유만 안내. 생년월일이 이미 있으면 동의만 받음

## 상세

**배경**
사용자 요청("코디포토넷 성인 버전 쓸 수 있도록 하자. 페이지보다는 코디포토넷처럼 열림 상자로 수정 열리도록").

**변경 범위**
apps/web(코디포토넷 adult-dialog·photonet), e2e/tests/operations.spec.ts, docs/plan/OPERATIONS.md

**기술 포인트**
- 열림 상자는 열려 있을 때만 본문을 그려 다시 열면 입력이 비워짐
- 닫기 버튼 이름(성인 확인 닫기)이 같은 말을 포함해 e2e 위치 지정을 exact로 고침
- 설정 페이지의 콘텐츠 수위(확인·끄기)는 그대로 둠 — 끄기는 거기서 함

**안 한 것**
본인인증으로 바꾸기(공개 전 필수)

## 결과

**동작 확인**
- 웹 타입 검사
- e2e 수위 3개 통과(취소, 동의 필수, 확인 뒤 성인 모드·19 갤러리), operations 17개 통과

**리스크**
없음

**후속**
feature/photonet-scene·photonet-rating develop 병합(사용자 확인 후)

**관련 문서**
docs/plan/OPERATIONS.md
