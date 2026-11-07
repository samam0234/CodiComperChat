# develop into main

| 항목 | 내용 |
|------|------|
| Subject | `merge: develop into main` |
| Full SHA | `9239ac0892cc1f0f36134cf811a3ecb3e478bb78` |
| Short SHA | `9239ac0` |
| Branch | `main` |
| Parent | `fd71be2, 916bb09` |
| Date | 2026-11-07 20:56:46 +0900 |

## 주 내용

- `develop`을 `main`에 병합했다: 공식 세계관, PortFolio, 웹 프로젝트 소개, ERD

## 상세

**배경**
사용자가 최종 검토 때 전체 병합을 요청했다(2026-11-07).

**변경 범위**
위 네 병합의 내용.

**안 한 것**
푸시(요청 없음), 서버 재배포.

## 결과

**동작 확인**
병합 전 develop에서 `typecheck:api`, API vitest 236개, 웹 `tsc`, mermaid 240개, 스크립트 시험 36개 통과.

**리스크**
`main`은 Vercel 웹 배포의 원천이라 푸시하면 `/project` 페이지가 웹에 나간다.

**후속**
푸시 여부 결정.
