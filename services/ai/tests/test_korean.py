import unittest

from app.services.korean import fix_parenthetical_josa, josa


class KoreanJosaTest(unittest.TestCase):
    def test_picks_particle(self) -> None:
        self.assertEqual(josa("이안", "이/가"), "이안이")
        self.assertEqual(josa("민수", "이/가"), "민수가")
        self.assertEqual(josa("교실", "으로/로"), "교실로")
        self.assertEqual(josa("집", "으로/로"), "집으로")
        self.assertEqual(josa("유지성", "이라고/라고"), "유지성이라고")

    def test_rewrites_parenthetical(self) -> None:
        self.assertEqual(fix_parenthetical_josa("유지성이(가) 물었다"), "유지성이 물었다")
        self.assertEqual(
            fix_parenthetical_josa("\ubbfc\uc218\uc744(\ub97c) \ubd88\ub800\ub2e4"),
            "\ubbfc\uc218\ub97c \ubd88\ub800\ub2e4",
        )
        self.assertEqual(fix_parenthetical_josa("그대로"), "그대로")


if __name__ == "__main__":
    unittest.main()
