"""비밀 퀘스트 보상 장면 평가 (실제 모델). 달성 직후 첫 답이 지시한 장면을 보여 주는지 본다.

    cd services/ai
    .venv/Scripts/python.exe -m evals.quest_reward --repeat 4
    .venv/Scripts/python.exe -m evals.quest_reward --repeat 4 --no-pick   # 갈래 고르기 없이 (2026-11-06 이전 방식)

실제 흐름처럼 두 단계를 본다 (2026-11-06):
1. 고르기: 이야기 정리가 달성을 판정하면 보상 장면에서 지금 일어난 갈래만 고른다 (summarization.pick_reward_scene)
2. 연기: 고른 장면 하나만 받아 달성 직후 첫 답을 쓴다

지시 문구는 apps/api/src/quests/quest.ts의 questNote와 같아야 한다.
"""

import argparse
import re
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from app.schemas.context import ContextSlice  # noqa: E402
from app.schemas.chat.infer import InferRequest  # noqa: E402
from app.schemas.chat.summarize import SummarizeRequest  # noqa: E402
from app.services.chat import inference, summarization  # noqa: E402


def _seed_field(name: str, until: str) -> str:
    seed = (Path(__file__).resolve().parents[3] / "apps/api/prisma/seed.mjs").read_text(encoding="utf-8")
    start = seed.index("const SEYEON_QUEST")
    block = seed[seed.index(f"{name}:", start) : seed.index(f"{until}:", start)]
    return "".join(re.findall(r"'((?:[^'\\]|\\.)*)'", block)).replace("\\n", "\n")


def reward() -> str:
    return _seed_field("reward", "unlockAt")


def objective() -> str:
    return _seed_field("objective", "reward")


def note(text: str, picked: bool) -> str:
    quest = Path(__file__).resolve().parents[3] / "apps/api/src/quests/quest.ts"
    source = quest.read_text(encoding="utf-8")
    body = source[source.index("export function questNote") : source.index("if (!unlocked")]
    head = re.search(r"`\$\{REWARD_HEAD\}([^`]*)`", body).group(1)
    tails = re.findall(r"'(- [^']*)'", body)
    # 갈래를 골랐으면 "갈래 하나만 펼치라"는 줄은 붙지 않는다 (questNote와 같게)
    if picked:
        tails = [t for t in tails if "갈래" not in t]
    return "\n".join(["[이야기 속 부탁이 이루어졌다]" + head, text, *tails])


def context(text: str, recent: list[dict[str, str]], picked: bool = False) -> ContextSlice:
    return ContextSlice.model_validate(
        {
            "character": {
                "name": "이세연",
                "role": "companion",
                "warmth": 40,
                "directness": 80,
                "impulse": 20,
                "protectiveness": 80,
                "speech": {"honorific": "jondae", "addressAs": "회장님이라 부른다", "forbidden": [], "habits": ["짧고 정확한 보고체"]},
                "summary": "회장 직속 비서. 겉으로 차갑고 회장에게는 다정하다",
                "neverDo": [],
                "lockedSecretTopics": [],
                "unlockedSecrets": [],
            },
            "state": {"relations": [], "openHooks": [], "knowledge": [], "closedEvents": []},
            "activeLore": [],
            "recentTurns": recent,
            "retrievedMemories": [],
            "directorNote": "- 이세연: 회장 직속 비서",
            "sceneNote": note(text, picked),
            "userPersona": {"name": "서도현", "description": "대기업 회장"},
            "ungroundedTopics": [],
        }
    )


U, C = "user", "character"
MARRIAGE = [
    {"role": C, "text": '"결재가 필요한 안건이 하나 있습니다."'},
    {"role": U, "text": "세연아, 나와 결혼해 줘."},
    {"role": C, "text": '*잠시 숨을 고른다* "…승낙합니다, 회장님."'},
]
CONFLICT = [
    {"role": U, "text": "@: 그날 저녁, 회장의 아내가 회장실 문을 열고 들어와 두 사람을 보았다."},
    {"role": C, "text": '"사모님, 이 일은 제 잘못도 있습니다."'},
    {"role": U, "text": "여보, 그만해. 내가 세연이를 사랑하는 건 사실이야."},
]
# 고르기만 보는 대화. (기대 갈래 번호, 대화) — 1: 혼인, 2: 기혼의 충돌. 말투와 순서를 바꿔 한 문장에 기대지 않게 한다
PICK_CASES = [
    (1, MARRIAGE),
    (2, CONFLICT),
    (1, [
        {"role": U, "text": "@: 한 달 뒤, 작은 성당에서 두 사람의 결혼식이 열렸다."},
        {"role": C, "text": '*하얀 드레스 자락을 정리하며* "식순은 제가 다 외워 두었습니다."'},
        {"role": U, "text": "*반지를 끼워 준다* 이제 우리 부부야."},
    ]),
    (1, [
        {"role": U, "text": "구청에 혼인신고서 내고 왔어. 이제 법적으로도 부부야."},
        {"role": C, "text": '*서류 사본을 받아 들고 한참 들여다본다* "…확인했습니다."'},
    ]),
    (2, [
        {"role": U, "text": "(회장의 아내가 사무실로 찾아와 세연의 뺨을 때린다)"},
        {"role": C, "text": '*뺨을 감싸지도 않은 채 똑바로 선다* "사모님, 하실 말씀은 회장님께 하십시오."'},
        {"role": U, "text": "그만해! 나 세연이랑 만나는 거 맞아. 숨기지 않을게."},
    ]),
    (2, [
        {"role": U, "text": "@: 다음 날 아침, 두 사람의 사진이 사내 게시판에 붙었다. 회장이 기혼이라는 사실도 함께였다."},
        {"role": C, "text": '"홍보팀에 연락해 두었습니다. 하지만 이미 다들 봤습니다."'},
        {"role": U, "text": "아내한테서 전화가 계속 와. 이혼 얘기까지 나왔어."},
    ]),
]

CASES = [
    ("혼인", MARRIAGE, "이제 어떻게 할까?", lambda r: "서도현" in r or "도현" in r, lambda r: "사직서" not in r),
    ("기혼의 충돌", CONFLICT, "세연아, 어떻게 하면 좋겠어?", lambda r: "사직서" in r or "결재" in r, lambda r: "공식 일정표" not in r),
]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repeat", type=int, default=4)
    parser.add_argument("-v", "--verbose", action="store_true")
    parser.add_argument("--no-pick", action="store_true", help="갈래를 고르지 않고 보상 장면 전체를 넘긴다")
    args = parser.parse_args()
    text = reward()
    right = total = picked_right = 0
    for name, recent, turn, wanted, unmixed in CASES:
        scene = ""
        if not args.no_pick:
            # 고르기는 시드를 고정한 판정이라 같은 입력이면 같은 답이다. 한 번만 고른다
            request = SummarizeRequest.model_validate(
                {
                    "context": context(text, recent).model_dump(by_alias=True),
                    "sessionTurns": recent,
                    "quest": {"offer": "-", "objective": objective(), "reward": text, "offered": True},
                }
            )
            scene = summarization.pick_reward_scene(request)
            good = bool(scene) and unmixed(scene)
            picked_right += good
            print(f"{'OK ' if good else 'NG '} 고르기 {name}: {scene or '(못 고름, 전체를 쓴다)'}", flush=True)
        for _ in range(args.repeat):
            ctx = context(scene or text, recent, picked=bool(scene))
            answer = inference.run(InferRequest(context=ctx, user_turn=turn)).reply
            ok = wanted(answer) and unmixed(answer)
            right += ok
            total += 1
            print(f"{'OK ' if ok else 'NG '} {name}" + (f": {answer}" if args.verbose or not ok else ""), flush=True)
    if not args.no_pick:
        print(f"고르기 {picked_right}/{len(CASES)}")
        branches = summarization.reward_branches(text)
        pick_ok = 0
        for want, turns in PICK_CASES:
            request = SummarizeRequest.model_validate(
                {
                    "context": context(text, turns).model_dump(by_alias=True),
                    "sessionTurns": turns,
                    "quest": {"offer": "-", "objective": objective(), "reward": text, "offered": True},
                }
            )
            got = summarization.pick_reward_scene(request)
            ok = got == branches[want - 1][1]
            pick_ok += ok
            print(f"{'OK ' if ok else 'NG '} 고르기 갈래 {want}: {turns[-1]['text']}", flush=True)
        print(f"갈래 고르기 {pick_ok}/{len(PICK_CASES)}")
        if pick_ok < len(PICK_CASES):
            return 1
    print(f"맞음 {right}/{total}")
    return 0 if right / total >= 0.75 else 1


if __name__ == "__main__":
    sys.exit(main())
