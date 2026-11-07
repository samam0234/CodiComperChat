"""모델 없이 도는 시험: 가짜 채팅 모델로 LangGraph 경로·근거·API 계약을 본다."""
from pathlib import Path

import pytest
from langchain_core.language_models.fake_chat_models import FakeListChatModel

from app import create_app
from app.config import load_settings
from app.rag import KnowledgeBase, keywords, tokenize

KNOWLEDGE = Path(__file__).resolve().parents[1] / "knowledge"


class Recorder:
    """어느 모델 이름으로 몇 번 불렸는지 기록하고, fail에 든 모델은 연결 실패처럼 던진다."""

    def __init__(self, answer="답입니다 [1]", fail=()):
        self.calls, self.answer, self.fail = [], answer, set(fail)

    def __call__(self, model):
        self.calls.append(model)
        if model in self.fail:
            class Broken(FakeListChatModel):
                def _call(self, *a, **k):
                    raise ConnectionError("ollama down")
            return Broken(responses=["x"])
        return FakeListChatModel(responses=[self.answer] * 5)


def make(rec, **env):
    s = load_settings()
    s = s.__class__(**{**s.__dict__, "knowledge_dir": KNOWLEDGE, **env})
    return create_app(s, llm_for=rec).test_client()


def test_tokenize_korean_bigrams_and_ascii_words():
    assert tokenize("퀘스트를 BM25") == ["퀘스", "스트", "트를", "bm25"]
    assert keywords("오라클 배포에서 막힌 것") == ["oracle", "배포", "막힌"]


def test_knowledge_loaded():
    kb = KnowledgeBase(KNOWLEDGE)
    assert len(kb.docs) > 100
    assert "PortFolio/shared/content/portfolio.json" in kb.sources


def test_greeting_skips_model():
    rec = Recorder()
    r = make(rec).post("/chat", json={"message": "안녕하세요"}).get_json()
    assert rec.calls == []
    assert r["model"] == "rule" and "포트폴리오 가이드" in r["answer"]
    assert [s["node"] for s in r["steps"]] == ["route", "greeting"]


def test_project_question_uses_rag_and_cites_sources():
    rec = Recorder()
    r = make(rec).post("/chat", json={"message": "비밀 퀘스트 판정에서 잘못 통과 0건은 어떻게 만들었나요?"}).get_json()
    assert r["answer"] == "답입니다 [1]"
    assert [s["node"] for s in r["steps"]] == ["route", "condense", "retrieve", "grade", "generate"]
    assert r["sources"] and r["sources"][0]["n"] == 1
    assert any("quest" in s["source"] or "portfolio" in s["source"] or "README" in s["source"] for s in r["sources"])


def test_unrelated_question_does_not_invent():
    rec = Recorder()
    r = make(rec).post("/chat", json={"message": "파이썬으로 피자 주문하는 법"}).get_json()
    assert rec.calls == []
    assert r["steps"][-1]["node"] == "no_context"
    assert "지어내서 답하지 않을게요" in r["answer"]


def test_uses_e4b_only():
    rec = Recorder()
    r = make(rec).post("/chat", json={"message": "오라클 배포에서 막힌 것은?"}).get_json()
    assert r["model"] == "gemma4:e4b"
    assert set(rec.calls) == {"gemma4:e4b"}


def test_e4b_down_is_503():
    rec = Recorder(fail={"gemma4:e4b"})
    res = make(rec).post("/chat", json={"message": "오라클 배포에서 막힌 것은?"})
    assert res.status_code == 503
    assert rec.calls == ["gemma4:e4b"]


def test_follow_up_is_condensed_with_history():
    rec = Recorder(answer="월드코퍼챗 미니게임 보상은 어떻게 정해지나요?")
    r = make(rec).post(
        "/chat",
        json={"message": "그건 왜?", "history": [{"role": "user", "content": "월드코퍼챗 미니게임 보상"}, {"role": "assistant", "content": "서버가 정해요 [1]"}]},
    ).get_json()
    assert r["standalone"] == "월드코퍼챗 미니게임 보상은 어떻게 정해지나요?"


@pytest.mark.parametrize("body,code", [({}, 400), ({"message": ""}, 400), ({"message": "가" * 1001}, 400)])
def test_validation(body, code):
    assert make(Recorder()).post("/chat", json=body).status_code == code


def test_internal_token():
    c = make(Recorder(), internal_token="secret-token")
    assert c.post("/chat", json={"message": "안녕"}).status_code == 401
    assert c.post("/chat", json={"message": "안녕"}, headers={"X-Internal-Token": "secret-token"}).status_code == 200
    assert c.get("/health").status_code == 200
