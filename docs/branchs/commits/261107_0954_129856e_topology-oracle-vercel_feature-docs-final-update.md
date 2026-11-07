# 지금 운영 중인 Oracle·Vercel 구성을 Docker 토폴로지에 더한다

| 항목 | 내용 |
|------|------|
| Subject | `docs(architecture): 지금 운영 중인 Oracle·Vercel 구성을 Docker 토폴로지에 더한다` |
| Full SHA | `129856eff0c71d3bf73e8edbc5f301e69cfce314` |
| Short SHA | `129856e` |
| Branch | `feature/docs-final-update` |
| Parent | `8af37c1` |
| Date | 2026-11-07 09:54:34 +0900 |

## 주 내용

- `docs/Architecture/docker-topology.md`의 compose 표에 `deploy/oracle/docker-compose.yml`·`docker-compose.ai.yml`을 더했다
- "지금 운영 중인 구성 (Oracle + Vercel, 2026-11-07)" mermaid와 운영 메모를 더했다

## 상세

**배경**
토폴로지 문서에 GPU 목표 구성만 있었다.

**변경 범위**
문서 1개, mermaid 1개.

**기술 포인트**
`api`가 edge·internal 두 망에 붙는 것, compose 두 파일을 함께 줘야 하는 것을 적었다.

**안 한 것**
PNG 그림은 다시 만들지 않았다.

## 결과

**동작 확인**
`node scripts/check-mermaid.mjs` 실패 0.

**리스크**
없음.

**후속**
없음.
