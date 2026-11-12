import unittest

from app.modules.runtime.korean import fix_parenthetical_josa, josa, polish


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


class KoreanPolishTest(unittest.TestCase):
    def test_learned_errors_become_natural_and_stay(self) -> None:
        samples = {
            "오늘 안되요. 갈수있어요.": "오늘 안 돼요. 갈 수 있어요.",
            "그거 아니예요. 집예요.": "그거 아니에요. 집이에요.",
            "친구이에요. 뭔가 됬어요.": "친구예요. 뭔가 됐어요.",
            "웬지 몇일만 이다. 오랫만이에요.": "왠지 며칠만 이다. 오랜만이에요.",
            "집을를 치우고 오늘은는 쉬자.": "집을 치우고 오늘은 쉬자.",
            "유지성이(가) 안되서 금새 돌아왔다.": "유지성이 안 돼서 금세 돌아왔다.",
            "네, 알겠어요. 오늘도 천천히 이야기해 봐요.": "네, 알겠어요. 오늘도 천천히 이야기해 봐요.",
            "아이가 집에 갔어요. 어떡해.": "아이가 집에 갔어요. 어떡해.",
            "할 수 있어요. 것 같아요.": "할 수 있어요. 것 같아요.",
        }
        for wrong, right in samples.items():
            self.assertEqual(polish(wrong), right)
            self.assertEqual(polish(right), right)

    def test_does_not_restitch_a_name(self) -> None:
        self.assertEqual(polish("한지우가 커피를 내렸다."), "한지우가 커피를 내렸다.")


if __name__ == "__main__":
    unittest.main()
