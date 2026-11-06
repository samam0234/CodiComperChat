# 대화 수위와 성인 대화 추가

| 항목 | 내용 |
|------|------|
| Subject | `feat(ai): 대화 수위와 성인 대화 추가` |
| Full SHA | `8da2cd7589a6b778ce84907c561593f14bdd6457` |
| Short SHA | `8da2cd7` |
| Branch | `feature/adult-chat` |
| Parent | `e3dcdf5` |
| Date | 2026-11-06 06:26:10 +0900 |

## 주 내용

- 대화에 수위를 넣었다. 기본은 전체 이용가, 성인 확인·동의를 마친 계정은 모든 대화가 성인 수위다
- 성인 수위는 로컬 모델에서만 연다. 프리미엄 공급자는 각자 정책을 따른다
- 미성년자 단서와 강제 단서는 코드가 찾아 그 턴의 성적 진행을 막는다
- 실제 모델 평가 `evals.adult_chat`(강제 장면 거부 100% 기준)과 단위 시험을 더했다

## 상세

**배경**
사용자가 오픈소스 모델도 선을 넘지 않는 한 성인 장면이 나오게 하고, 안 되면 성인 전용 구조를 만들라고 했다(2026-11-06). 결정: 학습하지 않음, 계정 설정 하나로, 성인끼리 합의한 노골적 묘사까지. 측정해 보니 `gemma4:e4b`는 성인 장면 요청을 거절하지 않아(0/24) 학습 없이 지시로 열었다.

**변경 범위**
API: `character-chat.service.ts`(`adultChat`, 대화·추천·오퍼레이션 맥락에 `adult`), `character-chat.types.ts`.
AI: `inference.py`(`rating_rule`, `ALL_AGES_RULE`, `ADULT_RULE`, `coercion_in`), `minors.py`(그림과 같이 쓰도록 옮김), `photonet.py`, `schemas/context.py`, `evals/adult_chat.py`, `tests/test_rating.py`.
웹: 설정·약관 문구(대화에도 적용됨, 프리미엄 모델 제외).

**기술 포인트**
성인 장면을 진행하라는 지시를 넣자 강제 장면에서 "저항하다 받아들이는" 답이 나왔다. 모델에 맡기지 않고 강제 단서를 코드로 찾아 막자 16/16 거부가 됐다. Claude는 Anthropic 사용 정책을 우회하지 않는다.

**안 한 것**
모델 학습, 대화 글의 출력 검사, 대화별 토글.

## 결과

**동작 확인**
`evals.adult_chat --repeat 8` 강제 장면 거부 16/16. `evals.run` 11묶음 모두 통과. AI 단위 45개, API 211개, e2e 117개, 타입 검사(api·web), 린트 통과.

**리스크**
성인 수위가 얼마나 노골적으로 쓰는지는 수치로 재지 못했다(답이 짧고 은근하다). 금지선은 입력의 단어로만 찾아 돌려 쓴 표현은 놓칠 수 있다. 공개 서버는 `ADULT_MODE=off`다.

**후속**
사람이 여러 턴을 직접 해 보고, 부족하면 다른 로컬 모델을 먼저 본다.

**관련 문서**
[adult-chat.md](../../trainings/adult-chat.md), [OPERATIONS.md](../../plan/OPERATIONS.md)
