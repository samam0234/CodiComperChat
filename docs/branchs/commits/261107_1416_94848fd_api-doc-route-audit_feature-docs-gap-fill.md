# 라우트 대조 결과와 운영 Base URL을 API 문서에 적는다

| 항목 | 내용 |
|------|------|
| Subject | `docs(api): 라우트 대조 결과와 운영 Base URL을 API 문서에 적는다` |
| Full SHA | `94848fdfb29007bd00c4ed47dbf5db5a44be9536` |
| Short SHA | `94848fd` |
| Branch | `feature/docs-gap-fill` |
| Parent | `d0f04c0` |
| Date | 2026-11-07 14:16:24 +0900 |

## 주 내용

- `docs/API_DOCUMENTATION.md` 상태를 2026-11-07로 고치고, Nest 라우트 155개·FastAPI 라우트 24개를 문서와 대조한 결과(빠진 것 없음)를 적었다
- Base 표에 운영 API(`https://api.168-110-61-178.sslip.io`)와 내부 AI(바깥에 열리지 않음) 행을 더했다

## 상세

**배경**
문서 보강 요청(2026-11-07). 라우트가 문서에 다 있는지 의심돼 스크립트로 대조했다. 첫 대조에서 11개가 빠졌다고 나왔으나 전부 제 정규식이 `@Controller` 접두사를 잘못 합친 오탐이었고, 실제로는 모두 문서에 있었다(`admin/orders` 환불 포함).

**변경 범위**
`docs/API_DOCUMENTATION.md`.

**안 한 것**
응답 필드의 정확성까지는 대조하지 않았다(경로만).

## 결과

**동작 확인**
Nest: 컨트롤러 데코레이터 155개, FastAPI: 24개를 세어 문서 경로와 대조.

**리스크**
경로만 대조했다.

**후속**
없음.
