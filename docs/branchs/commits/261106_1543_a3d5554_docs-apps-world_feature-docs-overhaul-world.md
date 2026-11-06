# 앱별 README와 보안·에이전트 문서에 월드코퍼챗 추가

| 항목 | 내용 |
|------|------|
| Subject | `docs(readme): 앱별 README와 보안·에이전트 문서에 월드코퍼챗 추가` |
| Full SHA | `a3d5554c76d97359b3ddb159ab40a85685b62703` |
| Short SHA | `a3d5554` |
| Branch | `feature/docs-overhaul-world` |
| Parent | `3624adc` |
| Date | 2026-11-06 15:43:28 +0900 |

## 주 내용

- 앱별 README(apps/api·apps/web·console·services/ai·e2e)에 월드코퍼챗 구조도(mermaid)와 동작 설명을 더했다
- SECURITY.md 위협 표와 정본 스킬 문서(§7 문서 표)에 월드코퍼챗을 더했다

## 상세

**배경**
사용자 요청(2026-11-06): 다른 README도 상세하고 정확한 내용으로 고도화. 에이전트 문서도 맞춘다.

**변경 범위**
`apps/api/README.md`, `apps/web/README.md`, `console/README.md`, `services/ai/README.md`, `e2e/README.md`, `SECURITY.md`, `.agents/skills/codicomperchat/SKILL.md`.

**기술 포인트**
API README에는 모듈 관계와 보상 동시성(계정 잠금·OPEN 행만), 웹 README에는 화면 흐름과 중계의 경로 검사, AI README에는 진행자 처리 순서, e2e README에는 가짜 LLM·가짜 검수 표시와 직렬 실행을 적었다.

**안 한 것**
도구별 어댑터의 규칙 목록은 바뀌지 않아 그대로다.

## 결과

**동작 확인**
링크 검사 깨짐 0, 어댑터 시험 30개 통과.

**리스크**
GitHub에서 mermaid가 그려지는지는 원격에서 확인하지 못했다.

**후속**
병합.

**관련 문서**
[SECURITY.md](../../../SECURITY.md)
