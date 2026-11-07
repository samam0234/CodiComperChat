# 읽는 순서에 현황 문서를 넣다

| 항목 | 내용 |
|------|------|
| Subject | `docs(agents): 읽는 순서에 현황 문서를 넣다` |
| Full SHA | `8acc8682b724606a29286ea0931760cfc3d61062` |
| Short SHA | `8acc868` |
| Branch | `feature/readme-status-sync` |
| Parent | `cb75e39` |
| Date | 2026-11-07 23:16:58 +0900 |

## 주 내용

- 정본 스킬과 루트 AGENTS, 도구별 안내에 현황 문서를 읽는 순서로 넣었다
- 어댑터 규칙 목록은 같은 문장으로 맞춰 시험 30개가 통과하게 했다

## 상세

**배경**
기능 목록만 읽으면 그림·메일·콘솔이 지금 공개 주소에서도 되는 것처럼 이어질 수 있다.

**변경 범위**
AGENTS.md, .agents/, .cursor, .claude, .codex와 같은 형식의 도구 안내

**기술 포인트**
규칙 문장을 새로 만들지 않고 읽기 항목만 더했다. node --test scripts/adapters.test.mjs 30개 통과.

**안 한 것**
기획 원본. 어댑터 스킬 포인터 본문.

## 결과

**동작 확인**
adapters.test.mjs 30 passed

**리스크**
없음

**후속**
develop 병합, develop을 main에 병합, 푸시

**관련 문서**
[docs/STATUS.md](../STATUS.md)
[.agents/skills/codicomperchat/SKILL.md](../.agents/skills/codicomperchat/SKILL.md)
