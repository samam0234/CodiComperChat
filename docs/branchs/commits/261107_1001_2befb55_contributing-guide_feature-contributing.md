# 기여 절차를 CONTRIBUTING에 모으다

| 항목 | 내용 |
|------|------|
| Subject | `docs(docs): 기여 절차를 CONTRIBUTING에 모으다` |
| Full SHA | `2befb55ce48d07997c251fefdd60ed07f40dbe7b` |
| Short SHA | `2befb55` |
| Branch | `feature/contributing` |
| Parent | `1b98333` |
| Date | 2026-11-07 10:01:04 +0900 |

## 주 내용

- 허락된 기여자와 에이전트가 따르는 입구 문서 CONTRIBUTING.md를 추가했다
- 규칙 문장과 바뀌는 수는 정본에 두고, 순서·경계·커밋·시험·병합만 적었다
- README와 문서 허브에서 이 문서로 들어오게 했다

## 상세

**배경**
작업 규칙이 정본 스킬과 여러 가이드에 나뉘어 있어, 처음 보는 사람이 순서를 한 문서에서 따라가기 어려웠다.

**변경 범위**
CONTRIBUTING.md, README.md, docs/README.md

**기술 포인트**
정본을 복제하지 않는다. 기획 원본, 비밀값, 웹이 FastAPI를 직접 부르지 않는 경계, 커밋과 기록 커밋을 나누는 절차를 입구에 적었다. mermaid 두 블록은 mermaid 11로 파싱해 확인했다.

**안 한 것**
정본 SKILL.md와 어댑터를 고치지 않았다. 병합과 푸시는 하지 않았다.

## 결과

**동작 확인**
CONTRIBUTING.md의 mermaid 2블록 파싱 통과

**리스크**
정본이 바뀌면 이 입구의 순서 설명도 같이 고쳐야 한다. 수치는 일부러 적지 않았다.

**후속**
없음

**관련 문서**
[.agents/skills/codicomperchat/SKILL.md](../../../.agents/skills/codicomperchat/SKILL.md)
[docs/guidance/branch-merge.md](../../guidance/branch-merge.md)
[docs/guidance/commit-message.md](../../guidance/commit-message.md)
