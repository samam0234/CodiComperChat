"""무료 호스팅 API(OpenAI 호환) 백엔드: 요청 모양, 구조화 출력 재시도, 한도 초과 때 Ollama 폴백을 가짜 서버로 본다.

진짜 API·키·모델 없음. 가짜 서버 하나가 /v1/chat/completions(OpenAI 호환)와 /api/chat(Ollama)을 둘 다 받는다.
"""

import json
import os
import threading
import time
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from unittest import mock

from fastapi import HTTPException

from app.services import llm

STATE: dict[str, object] = {}
SCHEMA = {"type": "object", "properties": {"ok": {"type": "boolean"}}, "required": ["ok"]}


class Fake(BaseHTTPRequestHandler):
    def log_message(self, *_args):
        pass

    def _send(self, status: int, body: str, ctype: str = "application/json"):
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.end_headers()
        self.wfile.write(body.encode("utf-8"))

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(length) or b"{}")
        STATE.setdefault("calls", []).append((self.path, body, dict(self.headers)))
        if self.path.endswith("/chat/completions"):
            replies = STATE["api_replies"]
            status, text = replies.pop(0) if len(replies) > 1 else replies[0]
            if status == 200 and body.get("stream"):
                # SSE: 첫 조각 전에 기다림(first_delay) → 두 글자씩 → 중간에 멈춤(stall_after 조각 뒤)
                time.sleep(float(STATE.get("first_delay", 0)))
                pieces = [text[i : i + 2] for i in range(0, len(text), 2)]
                try:
                    self.send_response(200)
                    self.send_header("Content-Type", "text/event-stream")
                    self.end_headers()
                    for n, piece in enumerate(pieces):
                        if STATE.get("stall_after") is not None and n == STATE["stall_after"]:
                            time.sleep(float(STATE.get("stall", 2)))
                            return
                        chunk = {"choices": [{"delta": {"content": piece}}]}
                        self.wfile.write(f"data: {json.dumps(chunk, ensure_ascii=False)}\n\n".encode("utf-8"))
                        self.wfile.flush()
                    self.wfile.write(b"data: [DONE]\n\n")
                except OSError:
                    # 시간 제한 시험에서 클라이언트가 먼저 끊은 경우
                    return
            elif status == 200:
                self._send(200, json.dumps({"choices": [{"message": {"content": text}}]}, ensure_ascii=False))
            else:
                self._send(status, json.dumps({"error": "x"}))
        elif self.path == "/api/chat":
            line = json.dumps({"message": {"role": "assistant", "content": "예비 답"}, "done": True}, ensure_ascii=False)
            self._send(200, line + "\n", "application/x-ndjson")
        else:
            self._send(404, "{}")


class OpenAiBackendTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), Fake)
        threading.Thread(target=cls.server.serve_forever, daemon=True).start()
        cls.base = f"http://127.0.0.1:{cls.server.server_address[1]}"

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()

    def setUp(self):
        STATE.clear()
        STATE["api_replies"] = [(200, "안녕하세요")]
        env = {
            "LLM_FAKE": "",
            "LLM_BACKEND": "openai",
            "LLM_API_BASE": f"{self.base}/v1",
            "LLM_API_KEY": "key-not-real",
            "LLM_API_MODEL": "google/gemma-4-31b-it",
            "LLM_FALLBACK_OLLAMA": "",
            "OLLAMA_BASE_URL": self.base,
        }
        self.env = mock.patch.dict(os.environ, env)
        self.env.start()

    def tearDown(self):
        self.env.stop()

    def call(self, **kw) -> str:
        return llm.generate(system="s", contents=[llm.turn("user", "안녕")], max_output_tokens=50, **kw)

    def paths(self) -> list[str]:
        return [c[0] for c in STATE.get("calls", [])]

    def test_sends_openai_shape_with_key_and_api_model(self):
        self.assertEqual(self.call(temperature=0.5, seed=7, model="gemma4:12b"), "안녕하세요")
        path, body, headers = STATE["calls"][0]
        self.assertEqual(path, "/v1/chat/completions")
        self.assertEqual(body["model"], "google/gemma-4-31b-it")  # Ollama 태그가 아니라 API 모델
        self.assertEqual(body["max_tokens"], 50)
        self.assertEqual(body["seed"], 7)
        self.assertEqual(body["messages"][0]["role"], "system")
        self.assertEqual(headers["Authorization"], "Bearer key-not-real")

    def test_schema_goes_in_response_format_and_prompt_and_fence_is_stripped(self):
        STATE["api_replies"] = [(200, '```json\n{"ok": true}\n```')]
        self.assertEqual(json.loads(self.call(response_json_schema=SCHEMA)), {"ok": True})
        body = STATE["calls"][0][1]
        self.assertEqual(body["response_format"]["type"], "json_schema")
        self.assertIn('"required"', body["messages"][0]["content"])

    def test_retries_without_response_format_when_api_rejects_it(self):
        STATE["api_replies"] = [(400, ""), (200, '{"ok": true}')]
        self.assertEqual(json.loads(self.call(response_json_schema=SCHEMA)), {"ok": True})
        self.assertIn("response_format", STATE["calls"][0][1])
        self.assertNotIn("response_format", STATE["calls"][1][1])

    def test_rate_limit_without_fallback_becomes_503_in_korean(self):
        STATE["api_replies"] = [(429, "")]
        with self.assertRaises(HTTPException) as ctx:
            self.call()
        self.assertEqual(ctx.exception.status_code, 503)
        self.assertIn("한도", ctx.exception.detail)
        self.assertEqual(self.paths(), ["/v1/chat/completions"])

    def test_rate_limit_falls_back_to_ollama_when_enabled(self):
        STATE["api_replies"] = [(429, "")]
        with mock.patch.dict(os.environ, {"LLM_FALLBACK_OLLAMA": "1"}):
            self.assertEqual(self.call(), "예비 답")
        self.assertEqual(self.paths(), ["/v1/chat/completions", "/api/chat"])

    def test_server_error_falls_back_too(self):
        STATE["api_replies"] = [(503, "")]
        with mock.patch.dict(os.environ, {"LLM_FALLBACK_OLLAMA": "1"}):
            self.assertEqual(self.call(), "예비 답")

    def test_config_errors_fall_back_and_are_logged(self):
        # 키 만료·접근 거부(401·402·403·404)는 서버 설정 문제: 사용자가 기다리는 답은 예비로, 원인은 로그에 남긴다
        for status in (401, 402, 403, 404):
            with self.subTest(status=status):
                STATE.pop("calls", None)
                STATE["api_replies"] = [(status, "key expired")]
                with mock.patch.dict(os.environ, {"LLM_FALLBACK_OLLAMA": "1"}):
                    with self.assertLogs("codicomperchat.llm", level="WARNING") as logs:
                        self.assertEqual(self.call(), "예비 답")
                self.assertEqual(self.paths(), ["/v1/chat/completions", "/api/chat"])
                self.assertIn(f"({status})", logs.output[0])

    def test_config_error_in_json_call_falls_back_too(self):
        STATE["api_replies"] = [(401, "")]
        with mock.patch.dict(os.environ, {"LLM_FALLBACK_OLLAMA": "1"}):
            with self.assertLogs("codicomperchat.llm", level="WARNING"):
                self.call(response_json_schema=SCHEMA)
        self.assertEqual(self.paths(), ["/v1/chat/completions", "/api/chat"])

    def test_config_error_without_fallback_surfaces_with_status_in_detail(self):
        STATE["api_replies"] = [(401, "bad key")]
        with self.assertLogs("codicomperchat.llm", level="WARNING"):
            with self.assertRaises(HTTPException) as ctx:
                self.call()
        self.assertEqual(ctx.exception.status_code, 502)
        self.assertIn("401", ctx.exception.detail)
        self.assertEqual(self.paths(), ["/v1/chat/completions"])

    def test_bad_request_is_not_hidden_by_fallback(self):
        # 400·422는 우리 요청이 잘못된 것: 예비로 덮으면 버그가 숨는다
        STATE["api_replies"] = [(422, "")]
        with mock.patch.dict(os.environ, {"LLM_FALLBACK_OLLAMA": "1"}):
            with self.assertRaises(HTTPException) as ctx:
                self.call()
        self.assertEqual(ctx.exception.status_code, 502)
        self.assertEqual(self.paths(), ["/v1/chat/completions"])

    def test_connection_failure_falls_back(self):
        with mock.patch.dict(os.environ, {"LLM_FALLBACK_OLLAMA": "1", "LLM_API_BASE": "http://127.0.0.1:1/v1"}):
            self.assertEqual(self.call(), "예비 답")

    def test_missing_config_is_a_clear_500(self):
        with mock.patch.dict(os.environ, {"LLM_API_MODEL": ""}):
            with self.assertRaises(HTTPException) as ctx:
                self.call()
        self.assertEqual(ctx.exception.status_code, 500)

    def test_basic_tag_stays_on_local_ollama(self):
        self.assertEqual(self.call(model="gemma4:e4b"), "예비 답")
        path, body, _headers = STATE["calls"][0]
        self.assertEqual(path, "/api/chat")
        self.assertEqual(body["model"], "gemma4:e4b")

    def test_enhanced_on_ollama_backend_uses_nvidia_model(self):
        with mock.patch.dict(os.environ, {"LLM_BACKEND": "ollama", "LLM_API_BASE": f"{self.base}/v1", "LLM_API_MODEL": ""}):
            self.assertEqual(self.call(model="gemma4:12b"), "안녕하세요")
        path, body, headers = STATE["calls"][0]
        self.assertEqual(path, "/v1/chat/completions")
        self.assertEqual(body["model"], "google/gemma-4-31b-it")
        self.assertEqual(headers["Authorization"], "Bearer key-not-real")

    def test_enhanced_fallback_uses_basic_local_model(self):
        STATE["api_replies"] = [(429, "")]
        with mock.patch.dict(os.environ, {"LLM_FALLBACK_OLLAMA": "1"}):
            self.assertEqual(self.call(model="gemma4:12b"), "예비 답")
        self.assertEqual(STATE["calls"][1][1]["model"], "gemma4:e4b")

    def test_empty_answer_is_502(self):
        STATE["api_replies"] = [(200, "")]
        with self.assertRaises(HTTPException) as ctx:
            self.call()
        self.assertEqual(ctx.exception.status_code, 502)

    # ---- 2026-11-11: 한 턴 3분 53초 고침 ----

    def test_text_answers_are_streamed_and_joined(self):
        # 글로 답하는 호출은 stream: true로 받는다 (답 전체가 시간 제한 안에 와야 할 필요가 없다)
        STATE["api_replies"] = [(200, "느리지만 쓰고 있는 답")]
        self.assertEqual(self.call(), "느리지만 쓰고 있는 답")
        self.assertTrue(STATE["calls"][0][1]["stream"])

    def test_json_answers_stay_non_streaming(self):
        STATE["api_replies"] = [(200, '{"ok": true}')]
        self.call(response_json_schema=SCHEMA)
        self.assertFalse(STATE["calls"][0][1]["stream"])

    def test_slow_total_answer_is_not_cut_while_pieces_keep_coming(self):
        # 조각 사이 공백만 재므로, 전체가 읽기 제한보다 길어도 조각이 계속 오면 끊지 않는다
        STATE["api_replies"] = [(200, "가" * 40)]
        STATE["first_delay"] = 0.6
        with mock.patch.dict(os.environ, {"LLM_API_READ_TIMEOUT_SECONDS": "1", "LLM_FALLBACK_OLLAMA": "1"}):
            self.assertEqual(self.call(), "가" * 40)
        self.assertEqual(self.paths(), ["/v1/chat/completions"])

    def test_no_first_piece_in_time_falls_back_to_light_cpu(self):
        STATE["api_replies"] = [(200, "늦은 답")]
        STATE["first_delay"] = 2
        contents = [llm.turn("user" if i % 2 == 0 else "assistant", f"대사 {i}") for i in range(20)]
        with mock.patch.dict(os.environ, {"LLM_API_READ_TIMEOUT_SECONDS": "0.5", "LLM_FALLBACK_OLLAMA": "1"}):
            text = llm.generate(system="s", contents=contents, max_output_tokens=1200)
        self.assertEqual(text, "예비 답")
        _path, body, _headers = STATE["calls"][-1]
        # 가벼운 예비: 최근 8개 대사만, 출력은 320토큰까지
        self.assertEqual(len(body["messages"]), 1 + 8)
        self.assertEqual(body["messages"][-1]["content"], "대사 19")
        self.assertEqual(body["options"]["num_predict"], 320)

    def test_cut_after_pieces_is_an_error_not_a_fallback(self):
        # 화면에 반쯤 나간 답을 예비 답으로 바꿔 쓰지 않는다
        STATE["api_replies"] = [(200, "가나다라마바")]
        STATE["stall_after"] = 1
        with mock.patch.dict(os.environ, {"LLM_API_READ_TIMEOUT_SECONDS": "0.5", "LLM_FALLBACK_OLLAMA": "1"}):
            with self.assertRaises(HTTPException) as ctx:
                "".join(llm.iter_generate(system="s", contents=[llm.turn("user", "안녕")], max_output_tokens=50))
        self.assertEqual(ctx.exception.status_code, 502)
        self.assertEqual(self.paths(), ["/v1/chat/completions"])

    def test_background_work_does_not_fall_back_to_cpu(self):
        from app import request_priority

        STATE["api_replies"] = [(429, "")]
        request_priority.set_priority("background")
        try:
            with mock.patch.dict(os.environ, {"LLM_FALLBACK_OLLAMA": "1"}):
                with self.assertRaises(HTTPException) as ctx:
                    self.call()
                with self.assertRaises(HTTPException):
                    self.call(response_json_schema=SCHEMA)
        finally:
            request_priority.set_priority("foreground")
        self.assertEqual(ctx.exception.status_code, 503)
        self.assertNotIn("/api/chat", self.paths())

    def test_iter_generate_streams_hosted_pieces(self):
        STATE["api_replies"] = [(200, "한 조각씩 온다")]
        pieces = list(llm.iter_generate(system="s", contents=[llm.turn("user", "안녕")], max_output_tokens=50))
        self.assertGreater(len(pieces), 1)
        self.assertEqual("".join(pieces), "한 조각씩 온다")


if __name__ == "__main__":
    unittest.main()
