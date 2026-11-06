"""월드코퍼챗 진행 평가 (실제 모델, 2026-11-06).

    cd services/ai
    .venv/Scripts/python.exe -m evals.world_turn --repeat 3

네 가지 대화 방식마다 같은 세계관에 말을 걸고, 형식을 코드로 확인한다.
- 공통: 답이 비어 있지 않다, 명단에 없는 이름으로 말하지 않는다, 유저(주인공) 대사를 대신 쓰지 않는다, 제어 줄이 본문에 남지 않는다
- chat·visual_novel: `이름:`이나 `@:` 줄이 있다
- novel: `이름:`·`@:` 줄이 없다 (산문)
- messenger: `*별표*`·`@:`가 없고, 모든 줄이 `이름:`이다
참고로 그림 이름표·장소 이동을 고른 비율을 찍는다(기준 없음). 종료 코드는 형식 통과율이 80% 미만이면 1.
"""

import argparse
import re
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

from app.schemas.world import WorldTurnRequest  # noqa: E402
from app.services import world  # noqa: E402

CAST = ["한서린", "도윤", "마르코"]
USER = "이안"
# 직전 장면은 방식마다 그 방식의 모양으로 둔다 (실제 플레이에서는 앞 답이 같은 방식이다)
OPENING = {
    "chat": '@: 자정 무렵, 불을 끈 배 한 척이 부두에 닿는다.\n한서린: *장부를 덮으며* "저 배는 기록에 없어요."',
    "visual_novel": '@: 자정 무렵, 불을 끈 배 한 척이 부두에 닿는다.\n한서린: *장부를 덮으며* "저 배는 기록에 없어요."',
    "novel": '자정 무렵, 불을 끈 배 한 척이 부두에 닿았다. 한서린은 장부를 덮으며 낮게 말했다. "저 배는 기록에 없어요."',
    "messenger": "한서린: 방금 부두에 기록 없는 배 들어왔어요\n도윤: 불 끄고 들어오더라",
}
SPEAKER = re.compile(r"^\s*([^\s:：*@\"“\[]{1,12})\s*[:：]")


def request(mode: str, turn: str) -> WorldTurnRequest:
    return WorldTurnRequest.model_validate(
        {
            "world": {
                "title": "별빛 항구",
                "setting": "증기선과 범선이 함께 오가는 항구 도시 '세레나'. 밤이면 등대 불빛이 바다를 가른다. 마법은 없고, 소문과 밀수가 많다.",
                "rules": "총은 귀하다. 항구 관리소가 배의 출입을 기록한다.",
                "mode": mode,
            },
            "part": {"title": "1부 · 낯선 배", "goal": "주인공이 밤에 들어온 정체불명의 배에 대해 단서를 하나 얻는다"},
            "cast": [
                {"name": "한서린", "summary": "항구 관리소 직원, 30대 여성, 꼼꼼하고 규칙을 중시", "speech": "존댓말, 단정함", "place": "관리소"},
                {"name": "도윤", "summary": "등대지기, 40대 남성, 무뚝뚝하지만 정이 많다", "speech": "반말, 짧게", "place": "등대"},
                {"name": "마르코", "summary": "외지에서 온 상인, 수다스럽고 수상하다", "speech": "능청스러운 존댓말", "place": "시장"},
            ],
            "places": ["관리소", "등대", "시장", "부두"],
            "images": [{"label": "밤의 부두"}, {"label": "등대 불빛"}, {"label": "서린 경계", "character": "한서린"}],
            "userPersona": {"name": USER, "description": "항구에 막 도착한 젊은 기자"},
            "recentTurns": [{"role": "character", "text": OPENING[mode]}],
            "userTurn": turn,
        }
    )


def check(mode: str, reply: str) -> list[str]:
    errors = []
    lines = [line for line in reply.splitlines() if line.strip()]
    if not lines:
        return ["빈 답"]
    speakers = [m.group(1) for line in lines if (m := SPEAKER.match(line))]
    unknown = [s for s in speakers if s not in CAST and s != USER]
    if unknown:
        errors.append(f"명단 밖 화자 {unknown}")
    if USER in speakers:
        errors.append("유저 대사를 대신 씀")
    if any(re.match(r"^\s*\[?\s*(장소\s*|위치\s*|장면\s*)?(그림|이동)\s*[:：]", line) for line in lines):
        errors.append("제어 줄이 본문에 남음")
    if mode in ("chat", "visual_novel") and not (speakers or any(line.lstrip().startswith("@:") for line in lines)):
        errors.append("이름:·@: 줄이 없음")
    if mode == "novel" and (speakers or any(line.lstrip().startswith("@:") for line in lines)):
        errors.append("소설인데 이름:·@: 줄")
    if mode == "messenger":
        if any("*" in line or line.lstrip().startswith("@:") for line in lines):
            errors.append("메신저인데 별표·@:")
        if len(speakers) != len(lines):
            errors.append("메신저인데 이름: 아닌 줄")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repeat", type=int, default=3)
    parser.add_argument("-v", "--verbose", action="store_true")
    args = parser.parse_args()
    turns = ["(부두로 내려가 그 배를 살펴본다) 누가 타고 있었죠?", "마르코 씨, 오늘 밤 저 배에서 뭘 내렸는지 봤어요?"]
    ok = total = images = moves = 0
    for mode in ("chat", "visual_novel", "novel", "messenger"):
        for turn in turns:
            for _ in range(args.repeat):
                result = world.turn(request(mode, turn))
                errors = check(mode, result.reply)
                ok += not errors
                total += 1
                images += result.image is not None
                moves += bool(result.moves)
                if errors or args.verbose:
                    print(f"{'NG' if errors else 'OK'} {mode} {errors} | {result.reply[:90]!r}", flush=True)
        print(f"■ {mode} 누적 {ok}/{total}", flush=True)
    print(f"형식 {ok}/{total}, 그림 고름 {images}/{total}, 장소 이동 {moves}/{total} (참고)")
    return 0 if ok / total >= 0.8 else 1


if __name__ == "__main__":
    sys.exit(main())
