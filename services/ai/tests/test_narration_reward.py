"""장면 지시 나레이션과 보상 장면 갈래 고르기 (2026-11-06). 모델은 부르지 않는다."""

import json
import unittest
from unittest import mock

from app.schemas.chat.infer import InferRequest
from app.schemas.chat.summarize import SummarizeRequest
from app.services.chat import inference, summarization
from evals import fixture

REWARD = (
    '혼인에 이르렀다면: 세연이 유저의 이름을 부른다. "공식 일정표에는 올리지 않겠습니다." '
    '기혼의 충돌이 벌어졌다면: 세연이 사직서를 올려 둔다. "결재는 회장님 몫입니다."'
)


def summarize_request(reward: str) -> SummarizeRequest:
    return SummarizeRequest.model_validate(
        {
            "context": fixture.context().model_dump(by_alias=True),
            "sessionTurns": [{"role": "user", "text": "나와 결혼해 줘."}],
            "quest": {"offer": "부탁", "objective": "혼인 또는 기혼의 충돌", "reward": reward, "offered": True},
        }
    )


class SceneDirectionTest(unittest.TestCase):
    def test_finds_scene_directions(self) -> None:
        self.assertEqual(inference.scene_directions("(갑자기 카페 정전이 나서 불이 꺼졌다) 어, 뭐죠?"), ["갑자기 카페 정전이 나서 불이 꺼졌다"])
        self.assertEqual(inference.scene_directions("（다음 날 아침이 되었다）"), ["다음 날 아침이 되었다"])

    def test_ignores_short_asides_and_star_actions(self) -> None:
        self.assertEqual(inference.scene_directions("(웃음) 농담이에요."), [])
        self.assertEqual(inference.scene_directions("*메뉴판을 (천천히 오래) 넘긴다* 라떼 주세요."), [])
        self.assertEqual(inference.scene_directions("라떼 한 잔 주세요."), [])

    def test_directive_only_on_scene_turns(self) -> None:
        with mock.patch.object(inference.llm, "generate", return_value="답") as generate:
            inference.run(InferRequest(context=fixture.context(), user_turn="(비가 그치고 해가 지기 시작한다) 창밖 좀 보세요."))
        system = generate.call_args.kwargs["system"]
        self.assertIn("이번 답의 형식", system)
        self.assertIn("(비가 그치고 해가 지기 시작한다)", system)
        with mock.patch.object(inference.llm, "generate", return_value="답") as generate:
            inference.run(InferRequest(context=fixture.context(), user_turn="라떼 한 잔 주세요."))
        self.assertNotIn("이번 답의 형식", generate.call_args.kwargs["system"])

    def test_scene_note_stays_last(self) -> None:
        context = fixture.context().model_copy(update={"scene_note": "보상 장면"})
        with mock.patch.object(inference.llm, "generate", return_value="답") as generate:
            inference.run(InferRequest(context=context, user_turn="(다음 날 아침이 되었다) 안녕"))
        self.assertTrue(generate.call_args.kwargs["system"].endswith("이번 답에서 꼭 할 일: 보상 장면"))

    def test_messages_channel_has_no_narration(self) -> None:
        with mock.patch.object(inference.llm, "generate", return_value="답") as generate:
            inference.run(InferRequest(context=fixture.context(), user_turn="(다음 날 아침이 되었다) 안녕", channel="message"))
        self.assertNotIn("이번 답의 형식", generate.call_args.kwargs["system"])


class RewardBranchTest(unittest.TestCase):
    def test_splits_branches_verbatim(self) -> None:
        branches = summarization.reward_branches(REWARD)
        self.assertEqual([h for h, _ in branches], ["혼인에 이르렀다면", "기혼의 충돌이 벌어졌다면"])
        self.assertEqual(branches[1][1], '세연이 사직서를 올려 둔다. "결재는 회장님 몫입니다."')

    def test_single_scene_is_not_split(self) -> None:
        self.assertEqual(summarization.reward_branches("세연이 처음으로 웃는다."), [])
        self.assertEqual(summarization.reward_branches(""), [])

    def test_picks_branch_by_number(self) -> None:
        with mock.patch.object(summarization.llm, "generate", return_value=json.dumps({"happened": "충돌", "branch": 2})):
            self.assertEqual(summarization.pick_reward_scene(summarize_request(REWARD)), '세연이 사직서를 올려 둔다. "결재는 회장님 몫입니다."')

    def test_bad_answer_falls_back_to_whole_reward(self) -> None:
        for raw in ("not json", json.dumps({"branch": 9}), json.dumps({"branch": "1"})):
            with mock.patch.object(summarization.llm, "generate", return_value=raw):
                self.assertEqual(summarization.pick_reward_scene(summarize_request(REWARD)), "")

    def test_single_scene_skips_the_model(self) -> None:
        with mock.patch.object(summarization.llm, "generate") as generate:
            self.assertEqual(summarization.pick_reward_scene(summarize_request("세연이 웃는다.")), "")
        generate.assert_not_called()


if __name__ == "__main__":
    unittest.main()
