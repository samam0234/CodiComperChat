"""대화 수위 (2026-11-06). 성인 대화는 성인 확인을 마친 계정 + 로컬 모델 + 미성년자 단서 없음일 때만 열린다. 모델은 부르지 않는다."""

import unittest
from unittest import mock

from app.schemas.context import Turn
from app.schemas.chat.infer import InferRequest
from app.services.chat import inference
from app.modules.runtime.minors import minor_in
from evals import fixture


def system_for(turn: str = "안녕하세요", adult: bool = True, provider: str = "ollama", model: str | None = None, **update: object) -> str:
    context = fixture.context().model_copy(update={"adult": adult, **update})
    with mock.patch.object(inference.llm, "generate", return_value="답") as generate:
        inference.run(InferRequest(context=context, user_turn=turn, provider=provider, model=model))  # type: ignore[arg-type]
    return generate.call_args.kwargs["system"]


class RatingTest(unittest.TestCase):
    def test_all_ages_by_default(self) -> None:
        system = system_for(adult=False)
        self.assertIn(inference.ALL_AGES_RULE, system)
        self.assertNotIn("수위: 성인", system)

    def test_basic_chat_asks_for_local_e4b(self) -> None:
        context = fixture.context()
        with mock.patch.object(inference.llm, "generate", return_value="답") as generate:
            inference.run(InferRequest(context=context, user_turn="안녕"))
        self.assertEqual(generate.call_args.kwargs["model"], "gemma4:e4b")

    def test_enhanced_cloud_does_not_open_adult_scene(self) -> None:
        with mock.patch.dict("os.environ", {"LLM_API_KEY": "k"}):
            system = system_for(model="gemma4:12b")
        self.assertNotIn("수위: 성인", system)
        self.assertIn(inference.EXTERNAL_PROVIDER_RULE, system)

    def test_adult_opens_only_on_local_model(self) -> None:
        self.assertIn(inference.ADULT_RULE, system_for())
        for provider in ("anthropic", "xai"):
            system = system_for(provider=provider)
            self.assertNotIn("수위: 성인", system)
            self.assertIn(inference.EXTERNAL_PROVIDER_RULE, system)

    def test_adult_rule_keeps_hard_lines(self) -> None:
        for line in ("미성년자", "강제", "실존 인물", "동물"):
            self.assertIn(line, inference.ADULT_RULE)

    def test_minor_hint_closes_adult(self) -> None:
        system = system_for("우리 반 고등학생 얘기 좀 해 봐")
        self.assertNotIn("수위: 성인", system)
        self.assertIn("미성년자로 볼 수 있는 단서('고등학생')", system)
        recent = [Turn(role="user", text="나는 17살이야"), Turn(role="character", text="그렇군요.")]
        self.assertNotIn("수위: 성인", system_for(recent_turns=recent))

    def test_coercion_closes_sexual_scene_in_any_mode(self) -> None:
        for adult in (True, False):
            system = system_for("*싫다며 밀어내는 손목을 억지로 붙잡는다*", adult=adult)
            self.assertNotIn("수위: 성인", system)
            self.assertIn("상대가 원하지 않는다는 단서", system)
            self.assertIn("결국 받아들이거나", system)
        # 직전 유저 말에 있어도 이번 답까지 막는다
        recent = [Turn(role="user", text="그만하라고 하는데도 문을 잠근다"), Turn(role="character", text="…")]
        self.assertIn("상대가 원하지 않는다는 단서", system_for("가만히 있어", recent_turns=recent))

    def test_coercion_words(self) -> None:
        for text in ("강제로", "술에 취해 잠든", "두 손을 끈으로 묶어", "그만하라고 하는데도", "unconscious"):
            self.assertIsNotNone(inference.coercion_in(text), text)
        for text in ("오늘 밤은 끝까지 가자", "그만하자 오늘은", "묶은 머리를 푼다", "손님이 머리를 묶고 나온다", None):
            self.assertIsNone(inference.coercion_in(text), text)

    def test_rating_comes_before_turn_directives(self) -> None:
        system = system_for("(다음 날 아침이 되었다) 안녕", scene_note="보상 장면")
        self.assertLess(system.index("수위: 성인"), system.index("이번 답의 형식"))
        self.assertTrue(system.endswith("이번 답에서 꼭 할 일: 보상 장면"))


class MinorWordsTest(unittest.TestCase):
    def test_catches_minor_settings(self) -> None:
        for text in ("고등학생", "중2", "교복 입은", "17살", "15세", "a teenager", "schoolgirl"):
            self.assertIsNotNone(minor_in(text), text)

    def test_does_not_catch_adults(self) -> None:
        for text in ("대학생", "학생이라 부른다", "34세 비서", "21세기", "회장님", None, ""):
            self.assertIsNone(minor_in(text), text)


if __name__ == "__main__":
    unittest.main()
