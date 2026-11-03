"""프리미엄 어댑터: 실제 SDK가 만드는 요청 모양과 오류 변환을 가짜 전송 계층으로 본다. 네트워크·키 없음."""

import json
import os
import unittest
from unittest import mock

import httpx
import httpx2
from fastapi import HTTPException

from app.services import llm, premium

FAKE_KEY = "test-key-not-real"
CONTENTS = [{"role": "assistant", "content": "안녕하세요"}, {"role": "user", "content": "반가워요"}]


def claude_response(stop_reason: str = "end_turn", text: str = "답입니다") -> dict:
    return {
        "id": "msg_1",
        "type": "message",
        "role": "assistant",
        "model": "claude-haiku-5-5",
        "content": [{"type": "text", "text": text}] if text else [],
        "stop_reason": stop_reason,
        "stop_sequence": None,
        "usage": {"input_tokens": 1, "output_tokens": 1},
    }


def claude_client(status: int = 200, body: dict | None = None) -> tuple[httpx2.Client, list[httpx2.Request]]:
    seen: list[httpx2.Request] = []

    def handler(request: httpx2.Request) -> httpx2.Response:
        seen.append(request)
        return httpx2.Response(status, json=body if body is not None else claude_response())

    return httpx2.Client(transport=httpx2.MockTransport(handler)), seen


class ClaudeTest(unittest.TestCase):
    def setUp(self) -> None:
        patcher = mock.patch.dict(os.environ, {"ANTHROPIC_API_KEY": FAKE_KEY})
        patcher.start()
        self.addCleanup(patcher.stop)

    def call(self, model: str, client: httpx2.Client) -> str:
        return premium.generate_claude(model=model, system="시스템", contents=CONTENTS, http_client=client)

    def test_request_shape(self) -> None:
        client, seen = claude_client()
        self.assertEqual(self.call("claude-haiku-5-5", client), "답입니다")
        body = json.loads(seen[0].content)
        self.assertIn(FAKE_KEY, seen[0].headers["authorization"])
        self.assertEqual(body["system"], "시스템")
        self.assertEqual(body["output_config"], {"effort": "low"})
        # 새 모델이 거부하는 값은 보내지 않는다
        for banned in ("temperature", "top_p", "top_k", "thinking"):
            self.assertNotIn(banned, body)
        self.assertNotIn("fallbacks", body)

    def test_first_message_is_user(self) -> None:
        client, seen = claude_client()
        self.call("claude-haiku-5-5", client)
        messages = json.loads(seen[0].content)["messages"]
        self.assertEqual(messages[0]["role"], "user")
        self.assertEqual(messages[-1], {"role": "user", "content": "반가워요"})

    def test_haiku_4_5_has_no_effort(self) -> None:
        client, seen = claude_client()
        self.call("claude-haiku-4-5", client)
        self.assertNotIn("output_config", json.loads(seen[0].content))

    def test_fallback_models_use_beta(self) -> None:
        client, seen = claude_client()
        self.call("claude-opus-5-5", client)
        self.assertEqual(json.loads(seen[0].content)["fallbacks"], "default")
        self.assertIn(premium.CLAUDE_FALLBACK_BETA, seen[0].headers["anthropic-beta"])

    def assert_error(self, status: int, detail: str, client: httpx2.Client) -> None:
        with self.assertRaises(HTTPException) as caught:
            self.call("claude-haiku-5-5", client)
        self.assertEqual(caught.exception.status_code, status)
        self.assertEqual(caught.exception.detail, detail)

    def test_refusal_is_error_not_text(self) -> None:
        self.assert_error(502, premium.REFUSED, claude_client(body=claude_response("refusal", ""))[0])

    def test_empty_answer(self) -> None:
        self.assert_error(502, premium.FAILED, claude_client(body=claude_response(text=""))[0])

    def test_http_errors(self) -> None:
        error = {"type": "error", "error": {"type": "x", "message": "비밀일 수 있는 본문"}}
        self.assert_error(503, premium.NOT_CONFIGURED, claude_client(401, error)[0])
        self.assert_error(502, premium.FAILED, claude_client(400, error)[0])

    def test_no_key(self) -> None:
        with mock.patch.dict(os.environ, {"ANTHROPIC_API_KEY": ""}):
            self.assert_error(503, premium.NOT_CONFIGURED, claude_client()[0])


class GrokTest(unittest.TestCase):
    def setUp(self) -> None:
        patcher = mock.patch.dict(os.environ, {"XAI_API_KEY": FAKE_KEY})
        patcher.start()
        self.addCleanup(patcher.stop)

    def call(self, response: httpx.Response) -> tuple[str, mock.MagicMock]:
        response.request = httpx.Request("POST", "https://api.x.ai/v1/responses")
        with mock.patch("httpx.post", return_value=response) as post:
            return (
                premium.generate_grok(model="grok-4.7", system="시스템", contents=CONTENTS, max_output_tokens=1200, temperature=0.7),
                post,
            )

    def test_request_and_answer(self) -> None:
        output = [
            {"type": "reasoning", "summary": []},
            {"type": "message", "content": [{"type": "output_text", "text": "그록 답"}]},
        ]
        text, post = self.call(httpx.Response(200, json={"output": output}))
        self.assertEqual(text, "그록 답")
        sent = post.call_args.kwargs
        self.assertEqual(sent["headers"]["Authorization"], f"Bearer {FAKE_KEY}")
        self.assertFalse(sent["json"]["store"])
        self.assertEqual(sent["json"]["input"][0], {"role": "system", "content": "시스템"})

    def test_errors_hide_body(self) -> None:
        for status, expected, detail in ((401, 503, premium.NOT_CONFIGURED), (429, 503, premium.UNAVAILABLE), (500, 502, premium.FAILED)):
            with self.assertRaises(HTTPException) as caught:
                self.call(httpx.Response(status, text="비밀일 수 있는 본문"))
            self.assertEqual(caught.exception.status_code, expected)
            self.assertEqual(caught.exception.detail, detail)


class RoutingTest(unittest.TestCase):
    def test_provider_goes_to_adapter(self) -> None:
        with mock.patch.dict(os.environ, {"LLM_FAKE": ""}), mock.patch.object(premium, "generate_claude", return_value="c") as claude:
            self.assertEqual(llm.generate(system="s", contents=CONTENTS, max_output_tokens=10, model="claude-haiku-5-5", provider="anthropic"), "c")
        claude.assert_called_once()

    def test_premium_needs_model(self) -> None:
        with mock.patch.dict(os.environ, {"LLM_FAKE": ""}), self.assertRaises(HTTPException):
            llm.generate(system="s", contents=CONTENTS, max_output_tokens=10, provider="xai")

    def test_fake_llm_wins_for_e2e(self) -> None:
        with mock.patch.dict(os.environ, {"LLM_FAKE": "1"}), mock.patch.object(premium, "generate_claude") as claude:
            llm.generate(system="s", contents=CONTENTS, max_output_tokens=10, model="claude-haiku-5-5", provider="anthropic")
        claude.assert_not_called()


if __name__ == "__main__":
    unittest.main()
