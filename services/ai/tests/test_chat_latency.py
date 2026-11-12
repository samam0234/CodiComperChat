import unittest
from unittest import mock

from app.schemas.chat.infer import InferRequest
from app.schemas.context import Turn
from app.services.chat import inference
from evals import fixture


class ChatLatencyTest(unittest.TestCase):
    def test_basic_opening_and_followup_budgets(self):
        request = InferRequest(context=fixture.context(), user_turn="안녕하세요.")
        self.assertEqual(inference.output_budget(request), 192)
        request.context.recent_turns = [Turn(role="user", text="안녕"), Turn(role="character", text="어서 오세요.")]
        self.assertEqual(inference.output_budget(request), 96)

    def test_external_and_adult_budgets(self):
        request = InferRequest(context=fixture.context(), user_turn="안녕하세요.", provider="anthropic")
        self.assertEqual(inference.output_budget(request), 320)
        request.provider = "ollama"
        request.context.adult = True
        self.assertEqual(inference.output_budget(request), 420)

    def test_compact_prompt_preserves_story_and_memory(self):
        context = fixture.context().model_copy(update={"story_so_far": "금요일 오후 3시 수선화 서점 약속"})
        system, _, _ = inference._prompt(InferRequest(context=context, user_turn="약속 기억해요?"))
        self.assertIn(context.story_so_far, system)
        self.assertIn(context.character.summary, system)
        self.assertIn(context.director_note, system)
        for memory in context.retrieved_memories:
            self.assertIn(memory.text, system)

    def test_sync_and_stream_use_same_budget(self):
        request = InferRequest(context=fixture.context(), user_turn="안녕하세요.")
        with mock.patch.object(inference.llm, "generate", return_value="안녕하세요.") as generate:
            inference.run(request)
        with mock.patch.object(inference.llm, "iter_generate", return_value=iter(["안녕하세요."])) as stream:
            list(inference.iter_ndjson(request))
        self.assertEqual(generate.call_args.kwargs["max_output_tokens"], 192)
        self.assertEqual(stream.call_args.kwargs["max_output_tokens"], 192)
