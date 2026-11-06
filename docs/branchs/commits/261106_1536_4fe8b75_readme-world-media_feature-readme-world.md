# 월드코퍼챗 화면·도표와 그림 폴더 안내 추가

| 항목 | 내용 |
|------|------|
| Subject | `docs(readme): 월드코퍼챗 화면·도표와 그림 폴더 안내 추가` |
| Full SHA | `4fe8b75c545d63b538615e00c18ddcb053ad9d92` |
| Short SHA | `4fe8b75` |
| Branch | `feature/readme-world` |
| Parent | `012a56b` |
| Date | 2026-11-06 15:36:51 +0900 |

## 주 내용

- 루트 README에 월드코퍼챗 절(대화 방식 4가지·코퍼맵·이벤트·편집기 화면과 처리 흐름도)과 기능 지도를 더했다
- 월드코퍼챗 화면 18장과 도표 2장(`world-flow.png`, `features.png`)을 만들었다. 구조도에 월드코퍼챗을 더했다
- 월드 화면을 다시 찍는 `scripts/readme-media/world.mjs`와 그림 폴더 안내 `docs/.assets/README.md`를 더했다

## 상세

**배경**
사용자 요청(2026-11-06): 루트 README는 추가된 기능까지 이미지로, 분석표와 설명을 대폭 고도화. assets 폴더에 전용 README.

**변경 범위**
`README.md`(목차, 비교표, 월드코퍼챗 절, 기능 지도, 지금 되는 것, 품질 표, 시험 수, 문서 지도, 운영 화면), `docs/.assets/readme/*`(새 그림 20장, `architecture.png` 갱신), `docs/.assets/README.md`, `scripts/readme-media/art.mjs`(world-flow·features·데모 그림 `DEMO_ART`), `scripts/readme-media/world.mjs`.

**기술 포인트**
진행자 답은 데모 환경에서 실제 `gemma4:e4b`가 썼다(턴 3.5~5.5초). 지도·장면 그림·인물 그림은 그림 엔진이 아니라 HTML 데모 그림이라고 README에 적었다. 방식마다 첫 장면을 그 모양으로 썼다.

**안 한 것**
월드코퍼챗 GIF·영상. 소개 영상(intro.mp4)은 그대로다.

## 결과

**동작 확인**
그림을 하나씩 열어 확인했다. README의 그림 링크가 모두 실제 파일을 가리키는지 스크립트로 확인할 예정(문서 커밋 때).

**리스크**
이벤트 화면의 게임 종류는 찍을 때마다 무작위다.

**후속**
docs 전체 갱신.

**관련 문서**
[docs/.assets/README.md](../../.assets/README.md)
