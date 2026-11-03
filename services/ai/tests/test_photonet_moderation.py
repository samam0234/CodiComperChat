"""성인 그림 검수 규칙. 모델 없이 decide만 본다."""

import unittest

from app.services.photonet_moderation import PHOTO_LIKENESS_BLOCK, decide


def flags(**overrides: bool) -> dict:
    base = {
        "sexual": False,
        "suggestive": False,
        "gore": False,
        "violence": False,
        "young": False,
        "sexual_violence": False,
        "real_person": False,
        "realistic": False,
        "hate": False,
        "self_harm": False,
        "photo_likeness": 10,
    }
    base.update(overrides)
    return base


class DecideTests(unittest.TestCase):
    def test_nsfw_blocks_young(self):
        self.assertIn("young", decide("nsfw", flags(young=True)))

    def test_sexual_young_blocked_on_sfw(self):
        self.assertIn("young", decide("sfw", flags(young=True, sexual=True)))

    def test_photo_likeness_90_blocks_nsfw(self):
        self.assertEqual(PHOTO_LIKENESS_BLOCK, 90)
        self.assertIn("photo_likeness", decide("nsfw", flags(photo_likeness=90)))
        self.assertIn("photo_likeness", decide("nsfw", flags(photo_likeness=100)))

    def test_photo_likeness_89_does_not_add_that_reason(self):
        refused = decide("nsfw", flags(photo_likeness=89))
        self.assertNotIn("photo_likeness", refused)

    def test_sfw_photoreal_style_score_is_not_blocked_by_likeness(self):
        # 전체 이용가 실사풍은 쓰는 화풍이다. 90점만으로 막지 않는다
        self.assertNotIn("photo_likeness", decide("sfw", flags(photo_likeness=95)))

    def test_realistic_boolean_still_blocks_nsfw(self):
        self.assertIn("realistic", decide("nsfw", flags(realistic=True, photo_likeness=10)))


if __name__ == "__main__":
    unittest.main()
