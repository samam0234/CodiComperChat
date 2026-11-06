# 변형 제어 줄 버리기와 코퍼맵 핀 잘림 고침

| 항목 | 내용 |
|------|------|
| Subject | `fix(world): 변형 제어 줄 버리기와 코퍼맵 핀 잘림 고침` |
| Full SHA | `7fe2ed376e46c17361e9562420da5e0bf3c27c13` |
| Short SHA | `7fe2ed3` |
| Branch | `feature/readme-world` |
| Parent | `01a16d7` |
| Date | 2026-11-06 15:36:35 +0900 |

## 주 내용

- 진행자가 약속과 다른 모양으로 쓴 제어 줄(`[장소 이동: …]`, 괄호 없는 `장소 이동: -`, `[장면 그림: …]`)도 본문에서 버린다
- 코퍼맵 위쪽 핀의 이름표가 잘리지 않게 했다
- 편집기의 첫 장면 안내에 "대화 방식에 맞춰 쓰라"를 적었다

## 상세

**배경**
README 화면을 실제 모델로 찍다가 세 가지를 찾았다(2026-11-06). 평가는 형식만, e2e는 가짜 LLM의 고정 답만 봐서 잡지 못했다.

**변경 범위**
`services/ai/app/services/world.py`(`_LOOSE_CONTROL`, `_MOVE_LINE`이 `장소/위치 이동`도 받음), `tests/test_world.py`(`test_strips_loose_control_lines`), `evals/world_turn.py`(제어 줄 검사 넓힘), `apps/web/app/worlds/copper-map.module.css`, `apps/web/app/worlds/[id]/edit/world-editor.tsx`.

**기술 포인트**
변형 제어 줄은 버리기만 하고, 인물 이름 → 장소 모양일 때만 위치에 반영한다. 대사 속 "그림:"은 지우지 않는다(줄 맨 앞일 때만). 진행자는 앞 글의 모양을 따라 쓰므로 소설형의 첫 장면이 채팅 모양이면 답도 채팅 모양이 된다.

**안 한 것**
장소 이동을 더 자주 쓰게 하는 지시.

## 결과

**동작 확인**
AI 단위 `test_world` 9개 통과, e2e `worlds.spec.ts` 6개 통과(운영 빌드 다시 함). 데모 화면을 다시 찍어 세 문제가 없어진 것을 눈으로 확인했다.

**리스크**
없음.

**후속**
없음.

**관련 문서**
[world-copperchat.md](../../trainings/world-copperchat.md)
