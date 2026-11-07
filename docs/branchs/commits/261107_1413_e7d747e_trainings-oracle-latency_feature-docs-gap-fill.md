# Oracle 서버 응답 속도 실측과 재지 못한 것을 노트로 남긴다

| 항목 | 내용 |
|------|------|
| Subject | `docs(trainings): Oracle 서버 응답 속도 실측과 재지 못한 것을 노트로 남긴다` |
| Full SHA | `e7d747e27db0c8ed745186853e1f8ecaa50877a7` |
| Short SHA | `e7d747e` |
| Branch | `feature/docs-gap-fill` |
| Parent | `144d829` |
| Date | 2026-11-07 14:13:58 +0900 |

## 주 내용

- `docs/trainings/oracle-deploy-latency.md`를 만들었다: 호스팅 API 19.0초·예비 CPU 32.1초(각 1회), 시간 제한 사슬 mermaid, 재지 못한 것 6가지
- `docs/trainings/README.md` 노트 표에 추가했다

## 상세

**배경**
실측과 판단은 `docs/trainings/`에 남기는 규칙이다. 배포 때 잰 값이 어디에도 없었다.

**변경 범위**
문서 2개.

**기술 포인트**
표본이 1개라 판단 근거가 아니라고 못 박았다. 가장 큰 빈틈은 평가 11묶음을 gemma4:e4b로 맞춰 두어 호스팅 31B의 품질(말투·퀘스트 판정·환각·월드 형식)을 모른다는 점이다.

**안 한 것**
새로 잰 것은 없다. 평가는 돌리지 않았다.

## 결과

**동작 확인**
`node scripts/check-mermaid.mjs` 실패 0. 수치는 2026-11-07 `ai-deploy.sh` 출력에서 옮겼다.

**리스크**
31B 품질을 모른 채 운영 중이다.

**후속**
TASKS 3장에 평가 항목 추가 검토.
