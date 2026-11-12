"""Ollama 스트리밍 호출: 토큰이 계속 오면 읽기 제한보다 오래 걸려도 끊기지 않는지, 오류를 바르게 바꾸는지 본다.

진짜 Ollama 대신 같은 모양(NDJSON)으로 답하는 작은 HTTP 서버를 띄운다. 네트워크·모델 없음.
"""

import json
import os
import threading
import time
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from unittest import mock

from fastapi import HTTPException

from app.modules.runtime import llm

# 시험마다 바꾸는 가짜 서버의 동작
BEHAVIOR: dict[str, object] = {}


class FakeOllama(BaseHTTPRequestHandler):
    def log_message(self, *_args):  # 시험 출력 조용히
        pass

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(length) or b"{}")
        BEHAVIOR["last_body"] = body
        status = int(BEHAVIOR.get("status", 200))
        if status != 200:
            self.send_response(status)
            self.end_headers()
            self.wfile.write(b'{"error":"model not found"}')
            return
        self.send_response(200)
        self.send_header("Content-Type", "application/x-ndjson")
        self.end_headers()
        try:
            for piece in BEHAVIOR.get("pieces", []):
                time.sleep(float(BEHAVIOR.get("gap", 0)))
                self.wfile.write((json.dumps(piece, ensure_ascii=False) + "\n").encode("utf-8"))
                self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError):
            pass  # 시간 제한 시험에서 호출 쪽이 먼저 끊는다


def chunk(text: str, done: bool = False) -> dict:
    return {"message": {"role": "assistant", "content": text}, "done": done}


class OllamaStreamTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = ThreadingHTTPServer(("127.0.0.1", 0), FakeOllama)
        threading.Thread(target=cls.server.serve_forever, daemon=True).start()
        cls.base = f"http://127.0.0.1:{cls.server.server_address[1]}"

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()

    def setUp(self):
        BEHAVIOR.clear()
        env = {"OLLAMA_BASE_URL": self.base, "LLM_FAKE": ""}
        self.env = mock.patch.dict(os.environ, env)
        self.env.start()

    def tearDown(self):
        self.env.stop()

    def call(self) -> str:
        return llm.generate(system="s", contents=[llm.turn("user", "안녕")], max_output_tokens=50)

    def test_iter_yields_each_piece(self):
        BEHAVIOR["pieces"] = [chunk("안"), chunk("녕"), chunk("", done=True)]
        pieces = list(
            llm.iter_generate(system="s", contents=[llm.turn("user", "안녕")], max_output_tokens=50, model="gemma4:e4b")
        )
        self.assertEqual(pieces, ["안", "녕"])

    def test_joins_streamed_pieces_and_asks_for_stream(self):
        BEHAVIOR["pieces"] = [chunk("안녕"), chunk("하세요"), chunk("", done=True)]
        self.assertEqual(self.call(), "안녕하세요")
        self.assertIs(BEHAVIOR["last_body"]["stream"], True)

    def test_slow_answer_longer_than_read_timeout_is_not_cut(self):
        # 조각 사이 0.3초, 읽기 제한 0.5초, 전체 약 1.5초: 예전(전체에 고정 제한)이면 끊겼을 답
        BEHAVIOR["pieces"] = [chunk(str(i)) for i in range(5)] + [chunk("", done=True)]
        BEHAVIOR["gap"] = 0.3
        with mock.patch.dict(os.environ, {"OLLAMA_READ_TIMEOUT_SECONDS": "0.5"}):
            self.assertEqual(self.call(), "01234")

    def test_silence_longer_than_read_timeout_becomes_504(self):
        BEHAVIOR["pieces"] = [chunk("a"), chunk("", done=True)]
        BEHAVIOR["gap"] = 0.6
        with mock.patch.dict(os.environ, {"OLLAMA_READ_TIMEOUT_SECONDS": "0.2"}):
            with self.assertRaises(HTTPException) as ctx:
                self.call()
        self.assertEqual(ctx.exception.status_code, 504)

    def test_missing_model_becomes_502_with_pull_hint(self):
        BEHAVIOR["status"] = 404
        with self.assertRaises(HTTPException) as ctx:
            self.call()
        self.assertEqual(ctx.exception.status_code, 502)
        self.assertIn("ollama pull", ctx.exception.detail)

    def test_error_line_in_stream_becomes_502(self):
        BEHAVIOR["pieces"] = [chunk("a"), {"error": "out of memory"}]
        with self.assertRaises(HTTPException) as ctx:
            self.call()
        self.assertEqual(ctx.exception.status_code, 502)
        self.assertIn("out of memory", ctx.exception.detail)

    def test_empty_answer_is_502(self):
        BEHAVIOR["pieces"] = [chunk("", done=True)]
        with self.assertRaises(HTTPException) as ctx:
            self.call()
        self.assertEqual(ctx.exception.status_code, 502)

    def test_zero_means_no_read_limit(self):
        with mock.patch.dict(os.environ, {"OLLAMA_READ_TIMEOUT_SECONDS": "0"}):
            self.assertIsNone(llm.ollama_timeout().read)
        self.assertEqual(llm.ollama_timeout().read, 600.0)


if __name__ == "__main__":
    unittest.main()
