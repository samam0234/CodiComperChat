# feature/docs-gap-fill into develop

| 항목 | 내용 |
|------|------|
| Subject | `merge: feature/docs-gap-fill into develop` |
| Full SHA | `ea1339d204a87e7b0cca6b837be8210e61c1339f` |
| Short SHA | `ea1339d` |
| Branch | `develop` |
| Parent | `e68cbe2, fdb0abe` |
| Date | 2026-11-07 14:16:54 +0900 |

## 주 내용

- `feature/docs-gap-fill`을 `develop`에 병합했다: 호스팅 LLM 백엔드 문서(AI README), 제3자에게 나가는 데이터(SECURITY), 외부 서비스 고지(THIRD_PARTY), Vercel 배포(웹·콘솔 README), 실측 노트(oracle-deploy-latency), 모델 전략의 호스팅 백엔드 절, API 대조 결과와 운영 Base URL, 작업 지시서 U11·U12·T05·T06·Q08, 인수인계

## 상세

**배경**
사용자가 미비한 문서를 전체적으로 보강하고 전체 병합까지 하라고 했다(2026-11-07).

**변경 범위**
문서만 15개 안팎. 코드 변경 없음.

**안 한 것**
처리방침 문구와 코드(성인 모드 가드, 강화 모델 정리)는 고치지 않고 사용자 결정 항목으로 남겼다.

## 결과

**동작 확인**
`node scripts/check-mermaid.mjs` 172개 실패 0, `node --test scripts/record-commit.test.mjs scripts/adapters.test.mjs` 36개 통과. 충돌 없음.

**리스크**
처리방침의 국외 이전 표가 실제 구성과 다르다(U11).

**후속**
푸시.
