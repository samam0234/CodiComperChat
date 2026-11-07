# 배포 진입 문서의 로직 구조를 지금 운영과 목표로 나눠 다시 그린다

| 항목 | 내용 |
|------|------|
| Subject | `docs(deploy): 배포 진입 문서의 로직 구조를 지금 운영과 목표로 나눠 다시 그린다` |
| Full SHA | `c639f83e2d00e97d72dfdd805f0c448d66b380ed` |
| Short SHA | `c639f83` |
| Branch | `feature/docs-final-update` |
| Parent | `4eb881a` |
| Date | 2026-11-07 09:55:52 +0900 |

## 주 내용

- `docs/DEPLOYMENT.md` 로직 구조를 텍스트 상자에서 mermaid(지금 운영 vs GPU 목표)로 바꿨다
- "지금 운영 중 (2026-11-07)" 그림, 배포 기록 링크를 더하고 기존 그림·순서에 "GPU 서버 목표"를 붙였다

## 상세

**배경**
로직 구조가 "운영 (아직 올리지 않음)"으로 남아 있었다.

**변경 범위**
`docs/DEPLOYMENT.md`.

**안 한 것**
"결정된 것" 표의 GPU 서버 결정은 목표로 그대로 두었다.

## 결과

**동작 확인**
`node scripts/check-mermaid.mjs` 실패 0.

**리스크**
없음.

**후속**
없음.
