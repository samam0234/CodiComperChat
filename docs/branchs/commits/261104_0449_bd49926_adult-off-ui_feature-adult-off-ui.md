# 성인 모드를 끈 서버에서 성인 입구를 숨김

| 항목 | 내용 |
|------|------|
| Subject | `feat(web): 성인 모드를 끈 서버에서 성인 입구를 숨김` |
| Full SHA | `bd49926983837e2123d296fdb475ca31ecf21dff` |
| Short SHA | `bd49926` |
| Branch | `feature/adult-off-ui` |
| Parent | `c11a97b` |
| Date | 2026-11-04 04:49:59 +0900 |

## 주 내용

- `ADULT_MODE=off`이면 설정·코디포토넷·웹툰에서 성인 입구를 숨겼다
- 끈 서버 전용 e2e를 추가하고 CI에도 넣었다

## 상세

**배경**
운영 기본값은 성인 모드 끔인데 화면에는 입구가 남아 있어, 눌러도 거절되는 버튼이 보였다.

**변경 범위**
`apps/api/src/auth/auth.service.ts`, 설정·코디포토넷·웹툰 화면, `e2e/`, CI.

**기술 포인트**
`GET /auth/me`에 `adultAvailable`을 더했다. 두 그림 화면은 기존 `nsfw.reason === "DISABLED"`를 쓴다. 서버 차단은 그대로다.

**안 한 것**
약관·처리방침의 성인 모드 문구는 법률 검토 항목이라 고치지 않았다.

## 결과

**동작 확인**
`npm run test:e2e:adult-off` 통과, `npm run ci:local -- checks` 9/9.

**리스크**
없음.

**후속**
없음.

**관련 문서**
[e2e/README.md](../../../e2e/README.md)
