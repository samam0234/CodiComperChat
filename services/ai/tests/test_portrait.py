"""공방 AI 초상 프롬프트. 얼굴이 보이게, 화풍이 앞에 오게 (2026-11-03 실측에서 뒷모습·사진 같은 수채화가 나왔다).

cd services/ai && .venv/Scripts/python.exe -m unittest tests.test_portrait
"""

import unittest

from app.schemas.portrait import PortraitRequest
from app.services import image_engine, portrait


class ComposeTest(unittest.TestCase):
    def test_face_is_weighted(self) -> None:
        prompt = portrait.compose(PortraitRequest(style="수채화"), "")
        self.assertIn("facing viewer:1.3", prompt)

    def test_style_comes_before_look_for_every_style(self) -> None:
        for name, style in image_engine.STYLES.items():
            prompt = portrait.compose(PortraitRequest(style=name), "described look")
            self.assertLess(prompt.index(style.tags), prompt.index("described look"), name)

    def test_adult_tag_is_kept(self) -> None:
        prompt = portrait.compose(PortraitRequest(style="애니메이션"), "")
        self.assertIn("adult woman:1.2", prompt)


if __name__ == "__main__":
    unittest.main()
