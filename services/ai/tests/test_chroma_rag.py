import tempfile
import unittest
from pathlib import Path

from app.repositories.memory import chroma_rag
from app.modules.memory.rag_embed import cosine, embed, preprocess, profile


class EmbedTest(unittest.TestCase):
    def test_preprocess_collapses_space(self):
        self.assertEqual(preprocess("  반말   로\n답해  "), "반말 로 답해")

    def test_similar_korean_is_closer_than_unrelated(self):
        near = cosine(embed("반말로만 짧게 답해"), embed("상대가 반말이면 반말로만 짧게 답한다."))
        far = cosine(embed("반말로만 짧게 답해"), embed("점심에 김치찌개를 먹었다"))
        self.assertGreater(near, far)

    def test_common_language_stays_short(self):
        stats = profile([row["text"] for row in chroma_rag.common_documents()])
        self.assertEqual(stats["empty"], 0)
        self.assertGreater(stats["count"], 0)
        self.assertLessEqual(stats["max"], 80)


class ChromaTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory(ignore_cleanup_errors=True)
        self._old = chroma_rag.os.environ.get("CHROMA_DIR")
        chroma_rag.os.environ["CHROMA_DIR"] = str(Path(self.tmp.name) / "chroma")

    def tearDown(self):
        chroma_rag.close_client()
        if self._old is None:
            chroma_rag.os.environ.pop("CHROMA_DIR", None)
        else:
            chroma_rag.os.environ["CHROMA_DIR"] = self._old
        self.tmp.cleanup()

    def test_personal_memory_stays_with_that_user(self):
        chroma_rag.replace_personal("user-a", "char-1", [{"id": "m1", "text": "민준은 새벽 달리기를 한다"}])
        chroma_rag.replace_personal("user-b", "char-1", [{"id": "m2", "text": "민준은 고양이를 키운다"}])
        own = chroma_rag.query("user-a", "char-1", "새벽 달리기 했어?")
        other = chroma_rag.query("user-b", "char-1", "새벽 달리기 했어?")
        self.assertIn("민준은 새벽 달리기를 한다", own["personal"])
        self.assertNotIn("민준은 새벽 달리기를 한다", other["personal"])

    def test_common_hint_follows_the_question(self):
        chroma_rag.index_common()
        hit = chroma_rag.query("user-a", "char-1", "반말로만 답해줘")
        self.assertTrue(hit["common"])
        self.assertIn("반말", hit["common"][0])


if __name__ == "__main__":
    unittest.main()
