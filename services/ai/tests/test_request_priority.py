"""Nest가 보낸 X-AI-Priority가 요청을 처리하는 함수(스레드)까지 전달되는지 (2026-11-11)."""

import os
import unittest
from unittest import mock

from fastapi.testclient import TestClient

from app import request_priority
from app.main import app


def _probe() -> dict[str, bool]:
    return {"background": request_priority.is_background()}


class PriorityHeaderTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # 동기 함수는 스레드풀에서 돈다 — 실제 경로와 같은 조건으로 본다
        app.add_api_route("/__priority_probe", _probe, methods=["GET"])

    def setUp(self):
        self.env = mock.patch.dict(os.environ, {"AI_SERVICE_TOKEN": "t" * 32})
        self.env.start()
        self.client = TestClient(app)

    def tearDown(self):
        self.env.stop()

    def get(self, priority: str | None):
        headers = {"X-AI-Token": "t" * 32}
        if priority is not None:
            headers["X-AI-Priority"] = priority
        return self.client.get("/__priority_probe", headers=headers).json()

    def test_background_header_reaches_handler(self):
        self.assertEqual(self.get("background"), {"background": True})

    def test_missing_or_other_value_is_foreground(self):
        self.assertEqual(self.get(None), {"background": False})
        self.assertEqual(self.get("foreground"), {"background": False})
        self.assertEqual(self.get("urgent"), {"background": False})

    def test_does_not_leak_between_requests(self):
        self.assertEqual(self.get("background"), {"background": True})
        self.assertEqual(self.get(None), {"background": False})


if __name__ == "__main__":
    unittest.main()
