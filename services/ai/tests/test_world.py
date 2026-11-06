"""월드코퍼챗 진행 (2026-11-06). 모델은 부르지 않는다."""

import json
import os
import unittest
from unittest import mock

from app.schemas.world import PartCheckRequest, WorldTurnRequest
from app.services import world


def request(**update: object) -> WorldTurnRequest:
    base = {
        "world": {"title": "별빛 항구", "setting": "증기선이 오가는 항구 도시", "rules": "마법은 없다", "mode": "chat"},
        "part": {"title": "1부 도착", "goal": "주인공이 등대지기를 만난다"},
        "cast": [
            {"name": "한서린", "summary": "항구 관리인, 30대", "speech": "존댓말", "place": "부두"},
            {"name": "도윤", "summary": "등대지기, 무뚝뚝함", "place": "등대"},
        ],
        "places": ["부두", "등대", "시장"],
        "images": [{"label": "부두의 밤"}, {"label": "서린 웃음", "character": "한서린"}],
        "userTurn": "등대로 가 볼게요.",
    }
    base.update(update)
    return WorldTurnRequest.model_validate(base)


class ControlLineTest(unittest.TestCase):
    def test_strips_valid_controls(self) -> None:
        raw = '@: 바닷바람이 분다.\n한서린: "등대는 저쪽이에요."\n[그림: 부두의 밤]\n[이동: 한서린 → 등대]'
        result = world.parse_controls(raw, request())
        self.assertEqual(result.reply, '@: 바닷바람이 분다.\n한서린: "등대는 저쪽이에요."')
        self.assertEqual(result.image, "부두의 밤")
        self.assertEqual([(m.name, m.place) for m in result.moves], [("한서린", "등대")])

    def test_drops_unknown_labels_people_and_places(self) -> None:
        raw = "본문\n[그림: 없는 그림]\n[이동: 모르는 사람 → 등대]\n[이동: 도윤 → 달나라]"
        result = world.parse_controls(raw, request())
        self.assertEqual(result.reply, "본문")
        self.assertIsNone(result.image)
        self.assertEqual(result.moves, [])

    def test_strips_loose_control_lines(self) -> None:
        # 실제로 나온 변형: "[장소 이동: …]", 괄호 없는 "장소 이동: -", "[장면 그림: …]"
        raw = "본문\n[장소 이동: 관리소 → 부두]\n장소 이동: -\n[장면 그림: 밤의 부두]\n[장소 이동: 도윤 → 부두]"
        result = world.parse_controls(raw, request())
        self.assertEqual(result.reply, "본문")
        self.assertEqual([(m.name, m.place) for m in result.moves], [("도윤", "부두")])
        # 대사 속 "그림:"이나 "이동:"은 지우지 않는다
        self.assertEqual(world.parse_controls('한서린: "그림: 저건 뭐죠?"', request()).reply, '한서린: "그림: 저건 뭐죠?"')

    def test_turn_fills_empty_reply(self) -> None:
        with mock.patch.object(world.llm, "generate", return_value="[그림: 부두의 밤]"):
            result = world.turn(request())
        self.assertEqual(result.reply, "@: 잠시 정적이 흐른다.")
        self.assertEqual(result.image, "부두의 밤")


class SystemPromptTest(unittest.TestCase):
    def test_mode_style_and_cast(self) -> None:
        for mode, mark in (("novel", "소설"), ("messenger", "메신저"), ("visual_novel", "비주얼노벨"), ("chat", "한 줄에 한 사람")):
            system = world.build_system(request(world={"title": "t", "setting": "s", "mode": mode}))
            self.assertIn(mark, system)
            self.assertIn("한서린", system)

    def test_rating_rules(self) -> None:
        self.assertIn("수위: 전체 이용가", world.build_system(request()))
        self.assertIn("수위: 성인", world.build_system(request(adult=True)))
        minor = request(adult=True, cast=[{"name": "민아", "summary": "고등학생"}])
        self.assertIn("미성년자로 볼 수 있는 단서", world.build_system(minor))
        forced = request(adult=True, userTurn="싫다며 밀어내는 서린을 억지로 붙잡는다")
        self.assertIn("상대가 원하지 않는다는 단서", world.build_system(forced))

    def test_event_note_is_last(self) -> None:
        system = world.build_system(request(eventNote="유저가 주사위 게임에서 이겼다"))
        self.assertTrue(system.endswith("이 결과에 등장인물이 반응하게 한다."))


def part_request(*texts: str) -> PartCheckRequest:
    return PartCheckRequest.model_validate(
        {"part": {"title": "1부", "goal": "등대지기를 만난다"}, "turns": [{"role": "user", "text": t} for t in texts]}
    )


class PartCheckTest(unittest.TestCase):
    def test_evidence_must_be_in_transcript(self) -> None:
        good = json.dumps({"done": True, "evidence": "도윤 씨, 처음 뵙겠습니다"})
        with mock.patch.object(world.llm, "generate", return_value=good):
            self.assertTrue(world.part_check(part_request("도윤 씨, 처음 뵙겠습니다. 등대지기시죠?")).done)
        made_up = json.dumps({"done": True, "evidence": "등대지기와 악수를 나눴다"})
        with mock.patch.object(world.llm, "generate", return_value=made_up):
            self.assertFalse(world.part_check(part_request("등대로 가 볼게요")).done)
        with mock.patch.object(world.llm, "generate", return_value="not json"):
            self.assertFalse(world.part_check(part_request("등대로 가 볼게요")).done)

    def test_fake_mode_uses_marker(self) -> None:
        with mock.patch.dict(os.environ, {"LLM_FAKE": "1"}):
            self.assertTrue(world.part_check(part_request("좋아요 [파트완료]")).done)
            self.assertFalse(world.part_check(part_request("좋아요")).done)


if __name__ == "__main__":
    unittest.main()
