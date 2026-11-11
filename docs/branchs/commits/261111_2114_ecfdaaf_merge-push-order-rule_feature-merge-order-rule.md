# 병합과 푸시를 함께 시킬 때의 순서와 인수인계를 규칙에 박다

| 항목 | 내용 |
|------|------|
| Subject | `docs(guidance): 병합과 푸시를 함께 시킬 때의 순서와 인수인계를 규칙에 박다` |
| Full SHA | `ecfdaaf8d798db0c156fcbca851d5f79ffdabfd6` |
| Short SHA | `ecfdaaf` |
| Branch | `feature/merge-order-rule` |
| Parent | `34baf77` |
| Date | 2026-11-11 21:14:22 +0900 |

## 주 내용

병합과 푸시를 함께 시킬 때의 순서(main 병합 뒤 develop·main 같이 푸시)와 병합 전 확인 절차를 정본과 모든 도구 어댑터에 같은 문장으로 적고, 인수인계에 2026-11-11 상태를 더했다.

## 상세

### 배경

사용자가 "develop 푸시하기 전에 main 병합 먼저"라고 지적했다. 규칙에는 "푸시는 요청할 때만"만 있고 순서가 없었다. 같은 세션에서 인수인계 문서를 읽지 않고 시작한 것도 지적받았다. 또 다른 세션이 같은 브랜치를 병합한 걸 모르고 병합 기록 스크립트를 돌려 다른 커밋의 틀린 기록이 남았다(34baf77로 되돌림).

### 변경 범위

- 정본 `SKILL.md`(§5 표·절차 주석·그림, §8 8번)와 어댑터 규칙 목록(16개 파일), 스킬 포인터의 그림.
- `docs/guidance/branch-merge.md`: "병합과 푸시를 함께 시킬 때" 절(명령 순서, 다른 세션 확인).
- `docs/AGENT_HANDOVER.md`: 2026-11-11 상태 절, 작업 약속 4줄, 흐름도·mermaid, 최종 갱신일.
- `docs/STATUS.md`: 속도·호스팅 오류 고침이 서버에 아직 없음.
- `README.md` 규칙 한 줄.

### 기술 포인트

어댑터 규칙 목록은 `scripts/adapters.test.mjs`가 일치를 검사하므로 같은 문장을 한꺼번에 바꿨다. 기록 스크립트는 `HEAD`를 기록하므로 병합할 것이 없을 때 돌리지 않는다는 점을 절차에 적었다.

### 안 한 것

기획 원본은 고치지 않았다. 포트폴리오 지식 스냅샷(`PortFolio/…/knowledge`)은 생성물이라 다시 만들지 않았다.

## 결과

### 동작 확인

`node --test scripts/adapters.test.mjs` 30개 통과, mermaid 검사 243블록 실패 0.

### 리스크

없음(문서). 새 순서는 이 커밋 이후의 병합부터 적용된다.

### 후속

이 브랜치를 develop → main으로 병합하고 둘을 같이 푸시한다.

### 관련 문서

- `docs/guidance/branch-merge.md`
- `docs/AGENT_HANDOVER.md`
