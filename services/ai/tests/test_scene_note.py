"""보상 장면 지시와 웹툰 시드가 끝까지 전달되는지 본다. 모델·엔진은 부르지 않는다."""

import unittest
from unittest import mock

from app.schemas.chat.infer import InferRequest
from app.schemas.picture.webtoon import WebtoonPanelRequest
from app.modules.picture import image_engine
from app.services.picture import photonet, webtoon
from app.services.chat import inference
from evals import fixture


class SceneNoteTest(unittest.TestCase):
    def test_scene_note_is_last_and_fills_user_name(self) -> None:
        context = fixture.context().model_copy(update={"scene_note": "{{user}}의 이름을 부른다"})
        with mock.patch.object(inference.llm, "generate", return_value="답") as generate:
            inference.run(InferRequest(context=context, user_turn="안녕"))
        system = generate.call_args.kwargs["system"]
        self.assertTrue(system.endswith("이번 답에서 꼭 할 일: 민준의 이름을 부른다"))

    def test_without_scene_note_nothing_is_added(self) -> None:
        with mock.patch.object(inference.llm, "generate", return_value="답") as generate:
            inference.run(InferRequest(context=fixture.context(), user_turn="안녕"))
        self.assertNotIn("이번 답에서 꼭 할 일", generate.call_args.kwargs["system"])


class PanelSeedTest(unittest.TestCase):
    def test_seed_reaches_engine(self) -> None:
        request = WebtoonPanelRequest(plan={"people": [{"name": "한지우"}]}, seed=7)
        with (
            mock.patch.object(image_engine, "txt2img", return_value=(b"png", 8, 8)) as draw,
            mock.patch.object(photonet, "_check"),
            mock.patch.object(photonet, "_webp", return_value=b"webp"),
        ):
            webtoon.panel(request)
        self.assertEqual(draw.call_args.kwargs["seed"], 7)

    def test_seed_range_is_checked(self) -> None:
        with self.assertRaises(ValueError):
            WebtoonPanelRequest(plan={}, seed=-1)


if __name__ == "__main__":
    unittest.main()
