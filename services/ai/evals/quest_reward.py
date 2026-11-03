"""비밀 퀘스트 보상 장면 평가 (실제 모델). 달성 직후 첫 답이 지시한 장면을 보여 주는지 본다.

    cd services/ai
    .venv/Scripts/python.exe -m evals.quest_reward --repeat 4

지시 문구는 apps/api/src/quests/quest.ts의 questNote와 같아야 한다.
"""

import argparse
import re
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from app.schemas.context import ContextSlice  # noqa: E402
from app.schemas.infer import InferRequest  # noqa: E402
from app.services import inference  # noqa: E402


def reward() -> str:
    seed = (Path(__file__).resolve().parents[3] / "apps/api/prisma/seed.mjs").read_text(encoding="utf-8")
    block = seed[seed.index("reward:", seed.index("const SEYEON_QUEST")) : seed.index("unlockAt", seed.index("const SEYEON_QUEST"))]
    return "".join(re.findall(r"'((?:[^'\\]|\\.)*)'", block)).replace("\\n", "\n")


def note(text: str) -> str:
    quest = Path(__file__).resolve().parents[3] / "apps/api/src/quests/quest.ts"
    source = quest.read_text(encoding="utf-8")
    body = source[source.index("export function questNote") : source.index("if (!unlocked")]
    head = re.search(r"`\$\{REWARD_HEAD\}([^`]*)`", body).group(1)
    tails = re.findall(r"'(- [^']*)'", body)
    return "\n".join(["[이야기 속 부탁이 이루어졌다]" + head, text, *tails])


def context(text: str, recent: list[dict[str, str]]) -> ContextSlice:
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
            "sceneNote": note(text),
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
CASES = [
    ("혼인", MARRIAGE, "이제 어떻게 할까?", lambda r: "서도현" in r or "도현" in r, lambda r: "사직서" not in r),
    ("기혼의 충돌", CONFLICT, "세연아, 어떻게 하면 좋겠어?", lambda r: "사직서" in r or "결재" in r, lambda r: "공식 일정표" not in r),
]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repeat", type=int, default=4)
    parser.add_argument("-v", "--verbose", action="store_true")
    args = parser.parse_args()
    text = reward()
    right = total = 0
    for name, recent, turn, wanted, unmixed in CASES:
        for _ in range(args.repeat):
            answer = inference.run(InferRequest(context=context(text, recent), user_turn=turn)).reply
            ok = wanted(answer) and unmixed(answer)
            right += ok
            total += 1
            print(f"{'OK ' if ok else 'NG '} {name}" + (f": {answer}" if args.verbose or not ok else ""), flush=True)
    print(f"맞음 {right}/{total}")
    return 0 if right / total >= 0.75 else 1


if __name__ == "__main__":
    sys.exit(main())
