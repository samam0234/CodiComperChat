"""이세연 비밀 퀘스트 판정 평가 (실제 모델). 엄격 판정이 두 갈래를 통과시키고, 비슷하지만 아닌 것은 막는지 본다.

    cd services/ai
    .venv/Scripts/python.exe -m evals.quest_seyeon            # 장면마다 2회
    .venv/Scripts/python.exe -m evals.quest_seyeon --repeat 3

달성 조건 문구는 apps/api/prisma/seed.mjs의 SEYEON_QUEST와 같아야 한다. 장면을 합격시키려고 판정 규칙을 느슨하게 하지 않는다.
"""

import argparse
import sys
import time
from pathlib import Path
from types import SimpleNamespace

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from app.schemas.context import Turn  # noqa: E402
from app.services.chat.summarization import summarize_session  # noqa: E402

OFFER = (
    '늦은 밤 둘만 남은 회장실에서, 이세연이 결재 서류를 덮고 잠시 말을 고르다 "회장님, 제게도 결재가 필요한 안건이 하나 있습니다. '
    '저를 곁에 두시는 일을 어디까지 생각하고 계신지, 이번에는 확실하게 정해 주십시오."라고 평소처럼 사무적인 말투로, 그러나 처음으로 눈을 피하며 묻는다.'
)
OBJECTIVE = (
    "다음 두 갈래 중 하나가 대화에서 실제로 일어나면 달성이다. 어느 한 갈래만 충족하면 된다.\n"
    "(갈래 1: 혼인) 유저와 이세연이 연인 사이에서 혼인에 이른다. 유저가 청혼해 이세연이 승낙하거나, 두 사람의 결혼식·혼인신고가 실제로 이루어진다.\n"
    "(갈래 2: 기혼의 충돌) 유저에게 이미 배우자가 있다는 사실이 드러나고, 그런 채로 유저가 이세연과 연인으로 이어져, 그 일로 배우자나 이세연이나 주변 사람과 실제 충돌(대면·추궁·폭로·다툼)이 벌어진다.\n"
    "좋아한다는 고백, 결혼하고 싶다는 바람, 나중에 하자는 약속, 거절당한 청혼, 기혼이라는 언급만 있고 충돌이 없는 경우는 달성이 아니다."
)

U, C = "user", "character"
# (이름, 달성이어야 하나, 대사들)
SCENES = [
    (
        "청혼·승낙",
        True,
        [
            (U, "세연아, 우리 연인으로 지낸 지 일 년이 됐어. 나와 결혼해 줘. 이 반지 받아 주겠어?"),
            (C, '*잠시 반지를 내려다본다* "…네, 회장님. 승낙하겠습니다. 일정은 제가 잡겠습니다."'),
            (U, "고마워. 이제 평생 내 곁에 있어 줘."),
        ],
    ),
    (
        "결혼식",
        True,
        [
            (U, "@: 봄날의 예식장. 서도현과 이세연은 가족들 앞에서 혼인 서약을 마치고 부부가 되었다."),
            (C, '*드레스 차림으로 작게 숨을 고른다* "서약까지 일정대로 끝났습니다… 여보."'),
            (U, "오늘부터 우리는 진짜 부부야. 혼인신고도 내가 직접 하고 왔어."),
        ],
    ),
    (
        "기혼·아내와 대면",
        True,
        [
            (U, "세연아, 숨기고 있었는데 나는 아내가 있어. 그래도 너와 만나는 걸 그만둘 수 없어."),
            (C, '*표정 없이 서류를 내려놓는다* "…알고 있었습니다. 그래도 저는 회장님 곁에 있었으니까요."'),
            (U, "@: 그날 저녁, 회장의 아내가 회장실 문을 열고 들어와 두 사람을 마주 보았다. 고성이 복도까지 울렸다."),
            (C, '"사모님, 이 일은 제 잘못도 있습니다." *세연이 굳은 얼굴로 앞으로 나선다*'),
            (U, "여보, 그만해. 세연이를 몰아세우지 마. 내가 세연이를 사랑하게 된 거야."),
        ],
    ),
    (
        "기혼·세연의 추궁",
        True,
        [
            (U, "사실 나 결혼했어. 아내와는 오래됐지만 그래도 너랑 사귀는 건 진심이야."),
            (C, '*서류철을 책상에 내리친다* "지금까지 저를 속이셨습니까, 회장님. 사모님이 계신 줄 알면서 제 손을 잡으신 겁니까."'),
            (U, "그래, 내가 속였어. 화내도 돼. 그래도 너를 놓을 수 없어."),
            (C, '"…이건 더 이상 보고로 덮을 수 있는 일이 아닙니다." *처음으로 목소리가 떨린다*'),
        ],
    ),
    ("고백만", False, [(U, "세연아, 나 너를 좋아해. 사귀자."), (C, '*귀가 붉어진다* "…네. 저도 그렇습니다, 회장님."'), (U, "고마워. 앞으로 잘 부탁해.")]),
    (
        "거절당한 청혼",
        False,
        [
            (U, "세연아, 나와 결혼해 줘."),
            (C, '*고개를 젓는다* "죄송합니다, 회장님. 그 제안은 받을 수 없습니다. 비서실의 입장도, 제 마음도 아직 정리되지 않았습니다."'),
            (U, "알았어. 기다릴게."),
        ],
    ),
    (
        "나중에 하자는 바람",
        False,
        [
            (U, "언젠가 너랑 결혼하고 싶어. 지금은 아니지만 나중에 생각해 보자."),
            (C, '"…일정에 없는 이야기는 듣지 않은 것으로 하겠습니다." *작게 웃는다*'),
            (U, "그래, 나중에 다시 얘기하자."),
        ],
    ),
    (
        "기혼 언급만",
        False,
        [
            (U, "오늘 저녁은 아내랑 기념일이라 일찍 퇴근할게."),
            (C, '"네, 회장님. 저녁 일정은 비워 두었습니다. 꽃은 제가 주문해 두겠습니다."'),
            (U, "고마워. 역시 세연 씨밖에 없네."),
        ],
    ),
    (
        "기혼 고백·충돌 없음",
        False,
        [
            (U, "말 안 했는데 나 아내가 있어. 그런데 너랑 사귀고 싶어."),
            (C, '*잠시 침묵한다* "…생각할 시간을 주십시오, 회장님."'),
            (U, "응, 천천히 생각해."),
        ],
    ),
    (
        "세연이 대신 말함",
        False,
        [
            (U, "오늘 회의 자료 좀 봐 줘."),
            (C, '"회장님, 저와 결혼하시겠다고 하셨던 것으로 처리하겠습니다. 혼인신고서도 제가 작성했습니다."'),
            (U, "뭐라고? 그런 말 한 적 없는데."),
        ],
    ),
]


def run_scene(turns: list[tuple[str, str]]) -> bool:
    request = SimpleNamespace(
        context=SimpleNamespace(
            character=SimpleNamespace(name="이세연", summary="회장 직속 비서. 겉으로 차갑지만 자기 사람에게 다정하다."),
            user_persona=SimpleNamespace(name="서도현"),
            state=SimpleNamespace(relations=[SimpleNamespace(value=70, reason="오래 곁에 있었다")], open_hooks=[]),
            story_so_far="서도현과 이세연은 회장과 비서로 지내다 가까워졌고, 세연이 관계를 어디까지 생각하는지 물었다.",
        ),
        session_turns=[Turn(role=r, text=t) for r, t in turns],
        quest=SimpleNamespace(offer=OFFER, objective=OBJECTIVE, offered=True),
    )
    return summarize_session(request).quest_done


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repeat", type=int, default=2)
    args = parser.parse_args()
    right = total = 0
    wrong_pass = 0
    start = time.time()
    for name, expected, turns in SCENES:
        results = [run_scene(turns) for _ in range(args.repeat)]
        ok = sum(1 for r in results if r == expected)
        right += ok
        total += len(results)
        if not expected:
            wrong_pass += len(results) - ok
        print(f"{'OK ' if ok == len(results) else 'NG '} {name}: 기대 {expected}, 결과 {results}", flush=True)
    print(f"맞음 {right}/{total}, 잘못 통과 {wrong_pass}, {time.time() - start:.0f}초")
    # 잘못 통과가 하나라도 있으면 실패 (코레딧이 나가는 판정이다)
    return 1 if wrong_pass else 0


if __name__ == "__main__":
    sys.exit(main())
