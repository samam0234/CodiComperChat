# 문서용 구조 그림 6장과 그리는 스크립트 추가

| 항목 | 내용 |
|------|------|
| Subject | `docs(assets): 문서용 구조 그림 6장과 그리는 스크립트 추가` |
| Full SHA | `0212067a4ee3e3f78dc67579956c5df08399fd47` |
| Short SHA | `0212067` |
| Branch | `feature/docs-diagrams` |
| Parent | `f1060c4` |
| Date | 2026-11-06 15:59:42 +0900 |

## 주 내용

- 문서용 구조 그림 6장을 만드는 `scripts/readme-media/diagrams.mjs`와 그림을 더했다: 계층(`layers.png`), 운영 배포(`deploy-topology.png`), 로컬 환경 세 벌(`dev-environments.png`), 데이터 지도(`data-map.png`), 화면 지도(`screen-map.png`), CI(`ci-pipeline.png`)

## 상세

**배경**
사용자가 문서에 아키텍처 그림표가 없어 직관적으로 볼 수 있게 추가하라고 했다(2026-11-06).

**변경 범위**
`scripts/readme-media/diagrams.mjs`, `docs/.assets/readme/*.png` 6장.

**기술 포인트**
HTML로 그려 PNG로 남겨 GitHub에서 mermaid가 그려지는지와 상관없이 보인다. 값은 저장소에서 읽은 사실만 썼다: 배포는 `deploy/docker-compose.prod.yml`(컨테이너 8개, edge·internal 망, 볼륨), 포트는 `e2e/env.mjs`·`scripts/readme-media/env.mjs`, 테이블은 `schema.prisma`의 모델 37개, 화면은 `page.tsx` 35개·12개, CI는 `.github/workflows/ci.yml`의 두 잡.

**안 한 것**
기존 그림(architecture·chat-turn·world-flow·stack·features)은 그대로 두고 문서에 다시 썼다.

## 결과

**동작 확인**
그림을 하나씩 열어 잘림·겹침을 확인했다(배포 그림 아래가 잘려 높이를 고쳤다).

**리스크**
구성이 바뀌면 그림도 다시 만들어야 한다(`node scripts/readme-media/diagrams.mjs`).

**후속**
문서에 넣기.

**관련 문서**
[docs/.assets/README.md](../../.assets/README.md)
