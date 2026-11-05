# README 그림과 영상을 실제 앱에서 만드는 도구를 추가

| 항목 | 내용 |
|------|------|
| Subject | `chore(docs): README 그림과 영상을 실제 앱에서 만드는 도구를 추가` |
| Full SHA | `3cc85d7f0919a8f5ae38e6bcbce71a59b74945c4` |
| Short SHA | `3cc85d7` |
| Branch | `feature/readme-media` |
| Parent | `b5691e5` |
| Date | 2026-11-06 00:03:23 +0900 |

## 주 내용

- README 그림과 영상을 실제 앱에서 다시 만드는 도구를 `scripts/readme-media/`에 넣었다

## 상세

**배경**
사용자가 README에 그림과 영상을 요청했다. 그려 낸 화면이 아니라 실제 앱을 찍어야 믿을 수 있고, 앱이 바뀌면 다시 찍을 수 있어야 한다.

**변경 범위**
`scripts/readme-media/`.

**기술 포인트**
데모 전용 DB와 포트를 쓰고 개발 DB·개발 서버를 건드리지 않는다. 계정은 `example.com` 가짜 주소이고 성인 모드는 끈다. 제목 카드와 자막은 HTML을 Chrome으로 찍어 한글 글꼴 문제를 피했다.

**안 한 것**
ffmpeg를 저장소에 넣지 않았다. 경로를 환경변수로 받는다.

## 결과

**동작 확인**
이 커밋 시점에는 배너와 구조도만 만들어 눈으로 봤다. 나머지는 뒤 커밋에서 실제로 돌린다.

**리스크**
실제 그림 엔진을 쓰므로 수십 분 걸린다.

**후속**
스크린샷·영상 생성과 루트 README.

**관련 문서**
[scripts/readme-media/README.md](../../../scripts/readme-media/README.md)
