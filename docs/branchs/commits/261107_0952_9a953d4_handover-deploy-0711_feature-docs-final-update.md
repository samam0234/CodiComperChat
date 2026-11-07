# 2026-11-07 실제 배포 상태·결정·함정을 인수인계에 반영

| 항목 | 내용 |
|------|------|
| Subject | `docs(handover): 2026-11-07 실제 배포 상태·결정·함정을 인수인계에 반영` |
| Full SHA | `9a953d4f90900c5eaf02873576f5f5ad10ac13ef` |
| Short SHA | `9a953d4` |
| Branch | `feature/docs-final-update` |
| Parent | `7cacf70` |
| Date | 2026-11-07 09:52:17 +0900 |

## 주 내용

- `docs/AGENT_HANDOVER.md`의 요약·상태 표(배포·병합·원격·시험)를 2026-11-07 기준으로 고쳤다
- "2026-11-07 — 실제 배포" 절, 함정 5가지, 그날의 사용자 결정 표를 더했다

## 상세

**배경**
사용자가 문서를 지금 상태에 맞게 고도화하라고 했다(2026-11-07).

**변경 범위**
`docs/AGENT_HANDOVER.md` 한 파일.

**기술 포인트**
함정: Windows `git archive`의 CRLF, Oracle 개인키가 없을 때 Run Command의 한계(`ocarun`), Vercel `API_BASE_URL`의 `api.` 접두사, po3i10의 `bootstrap.sh`는 다른 compose 전제, compose 두 파일을 함께 줄 것.

**안 한 것**
없음.

## 결과

**동작 확인**
`node scripts/check-mermaid.mjs` 실패 0.

**리스크**
없음.

**후속**
TASKS·TESTING·환경변수·구성도 문서도 맞춘다.
